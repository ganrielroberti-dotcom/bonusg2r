import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUVO_BASE = "https://api.auvo.com.br/v2";
const TOKEN_TTL_MS = 25 * 60 * 1000;
const SAO_PAULO_OFFSET = -3; // UTC-3 (simplified, DST not applicable since 2019)

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAuvoToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const apiKey = Deno.env.get("AUVO_API_KEY");
  const apiToken = Deno.env.get("AUVO_API_TOKEN");
  if (!apiKey || !apiToken) throw new Error("AUVO credentials not configured");

  const res = await fetch(
    `${AUVO_BASE}/login/?apiKey=${encodeURIComponent(apiKey)}&apiToken=${encodeURIComponent(apiToken)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auvo login failed [${res.status}]: ${text}`);
  }
  const data = await res.json();
  const token = data?.result?.accessToken;
  if (!token) throw new Error("No accessToken");
  cachedToken = token;
  tokenExpiry = Date.now() + TOKEN_TTL_MS;
  return token;
}

async function auvoFetch(path: string, retries = 2): Promise<unknown> {
  const token = await getAuvoToken();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${AUVO_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auvo [${res.status}] ${path}: ${text}`);
    }
    return await res.json();
  }
  throw new Error(`Max retries for ${path}`);
}

function getMonthBounds(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  // Month boundaries in São Paulo time, converted to UTC
  const start = new Date(Date.UTC(year, month - 1, 1, -SAO_PAULO_OFFSET, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, -SAO_PAULO_OFFSET, 0, 0));
  return { start, end };
}

interface TaskData {
  taskID: number;
  externalId: string;
  customerDescription: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  taskStatus: number;
  duration: string | null;
  durationDecimal: string | null;
  idUserTo: number;
}

function calculateTaskHours(
  task: TaskData,
  monthStart: Date,
  monthEnd: Date,
  now: Date
): { hours: number; calculation: string } {
  const { checkInDate, checkOutDate, taskStatus, durationDecimal } = task;

  if (!checkInDate) {
    return { hours: 0, calculation: "No check-in date" };
  }

  const checkin = new Date(checkInDate);
  if (isNaN(checkin.getTime())) {
    return { hours: 0, calculation: "Invalid check-in date" };
  }

  // For paused tasks (status 6), use durationDecimal if available
  if (taskStatus === 6 && durationDecimal) {
    const dec = parseFloat(durationDecimal);
    if (!isNaN(dec) && dec > 0) {
      // Clip: only count if checkin is within month window
      if (checkin >= monthEnd) return { hours: 0, calculation: "Paused task outside month" };
      return {
        hours: Math.round(dec * 100) / 100,
        calculation: `Paused: using durationDecimal=${dec}h`,
      };
    }
  }

  // For completed tasks (status 4/5) with durationDecimal, prefer it (Auvo deducts pauses)
  if ((taskStatus === 4 || taskStatus === 5) && durationDecimal) {
    const dec = parseFloat(durationDecimal);
    if (!isNaN(dec) && dec > 0) {
      // Still need to clip to month window for cross-month tasks
      const checkout = checkOutDate ? new Date(checkOutDate) : null;
      if (checkout && !isNaN(checkout.getTime())) {
        // If entire task is outside month, skip
        if (checkout <= monthStart || checkin >= monthEnd) {
          return { hours: 0, calculation: "Completed task outside month window" };
        }
        // If task spans across month boundary, we can't just use durationDecimal
        // because it represents total duration. We need to ratio it.
        if (checkin < monthStart || checkout > monthEnd) {
          const totalMs = checkout.getTime() - checkin.getTime();
          if (totalMs <= 0) return { hours: dec, calculation: `durationDecimal=${dec}h (no clip needed)` };
          const clipStart = Math.max(checkin.getTime(), monthStart.getTime());
          const clipEnd = Math.min(checkout.getTime(), monthEnd.getTime());
          const ratio = Math.max(0, clipEnd - clipStart) / totalMs;
          const clipped = Math.round(dec * ratio * 100) / 100;
          return {
            hours: clipped,
            calculation: `durationDecimal=${dec}h * ratio=${ratio.toFixed(3)} = ${clipped}h (cross-month)`,
          };
        }
      }
      return { hours: dec, calculation: `durationDecimal=${dec}h` };
    }
  }

  // Fallback: use checkIn/checkOut or checkIn/now
  const ini = new Date(Math.max(checkin.getTime(), monthStart.getTime()));

  let fim: Date;
  if (checkOutDate) {
    const checkout = new Date(checkOutDate);
    if (isNaN(checkout.getTime())) {
      return { hours: 0, calculation: "Invalid checkout date" };
    }
    fim = new Date(Math.min(checkout.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 3) {
    // CheckedIn, still working
    fim = new Date(Math.min(now.getTime(), monthEnd.getTime()));
  } else if (taskStatus === 6) {
    // Paused without durationDecimal
    return { hours: 0, calculation: "Paused without durationDecimal (conservative: 0h)" };
  } else {
    // Other statuses without checkout
    return { hours: 0, calculation: `Status ${taskStatus} without checkout` };
  }

  const diffMs = Math.max(0, fim.getTime() - ini.getTime());
  const hours = Math.round((diffMs / 3600000) * 100) / 100;
  return {
    hours,
    calculation: `${ini.toISOString()} to ${fim.toISOString()} = ${hours}h`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = req.method === "POST" ? await req.json() : {};
    const monthKey: string = body.monthKey || new Date().toISOString().slice(0, 7);
    const now = new Date();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert sync log
    const { data: logEntry } = await supabase
      .from("auvo_sync_log")
      .insert({ month_key: monthKey, status: "running" })
      .select("id")
      .single();
    const logId = logEntry?.id;

    // Get user mappings
    const { data: mappings } = await supabase
      .from("auvo_user_mapping")
      .select("auvo_user_id, auvo_user_name, employee_id");

    if (!mappings || mappings.length === 0) {
      // Update log
      if (logId) {
        await supabase
          .from("auvo_sync_log")
          .update({
            finished_at: new Date().toISOString(),
            status: "error",
            errors: [{ message: "No user mappings configured" }],
          })
          .eq("id", logId);
      }
      return new Response(
        JSON.stringify({ error: "No user mappings configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { start: monthStart, end: monthEnd } = getMonthBounds(monthKey);
    const errors: unknown[] = [];
    let totalTasksProcessed = 0;
    let employeesUpdated = 0;

    // Format dates for Auvo API (MM/DD/YYYY)
    const fmtDate = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;

    for (const mapping of mappings) {
      try {
        // Fetch all tasks for this user in the month
        const allTasks: TaskData[] = [];
        let page = 1;

        while (true) {
          const filter = JSON.stringify({
            startDate: fmtDate(monthStart),
            endDate: fmtDate(monthEnd),
            idUserTo: mapping.auvo_user_id,
          });

          const result = (await auvoFetch(
            `/tasks/?paramFilter=${encodeURIComponent(filter)}&page=${page}&pageSize=100&order=asc`
          )) as { result: { content: TaskData[]; totalPages: number } };

          const content = result?.result?.content || [];
          allTasks.push(...content);

          if (page >= (result?.result?.totalPages || 1)) break;
          page++;
        }

        // Calculate hours for each task
        let totalHours = 0;
        const tasksDetail: unknown[] = [];

        for (const task of allTasks) {
          const { hours, calculation } = calculateTaskHours(task, monthStart, monthEnd, now);
          totalHours += hours;
          tasksDetail.push({
            taskID: task.taskID,
            externalId: task.externalId || "",
            customerDescription: task.customerDescription || "",
            checkInDate: task.checkInDate,
            checkOutDate: task.checkOutDate,
            taskStatus: task.taskStatus,
            durationDecimal: task.durationDecimal,
            calculatedHours: hours,
            calculation,
          });
        }

        totalHours = Math.round(totalHours * 100) / 100;
        totalTasksProcessed += allTasks.length;

        // Upsert into auvo_hours_cache
        await supabase.from("auvo_hours_cache").upsert(
          {
            month_key: monthKey,
            employee_id: mapping.employee_id,
            auvo_user_id: mapping.auvo_user_id,
            total_hours: totalHours,
            tasks_detail: tasksDetail,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "month_key,employee_id" }
        );

        // Upsert into horas_trabalhadas (the main app table)
        const { data: existing } = await supabase
          .from("horas_trabalhadas")
          .select("id")
          .eq("employee_id", mapping.employee_id)
          .eq("month_key", monthKey)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("horas_trabalhadas")
            .update({ horas: totalHours })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("horas_trabalhadas")
            .insert({
              employee_id: mapping.employee_id,
              month_key: monthKey,
              horas: totalHours,
            });
        }

        employeesUpdated++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error syncing user ${mapping.auvo_user_id}:`, msg);
        errors.push({
          auvo_user_id: mapping.auvo_user_id,
          employee_id: mapping.employee_id,
          error: msg,
        });
      }
    }

    // Update sync log
    const finalStatus = errors.length > 0 ? (employeesUpdated > 0 ? "partial" : "error") : "success";
    if (logId) {
      await supabase
        .from("auvo_sync_log")
        .update({
          finished_at: new Date().toISOString(),
          employees_count: employeesUpdated,
          tasks_count: totalTasksProcessed,
          errors,
          status: finalStatus,
        })
        .eq("id", logId);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `Sync ${monthKey}: ${employeesUpdated} employees, ${totalTasksProcessed} tasks, ${errors.length} errors, ${elapsed}s`
    );

    return new Response(
      JSON.stringify({
        monthKey,
        employeesUpdated,
        tasksProcessed: totalTasksProcessed,
        errors,
        status: finalStatus,
        elapsedSeconds: parseFloat(elapsed),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("auvo-hours-sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
