import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { auvoFetch } from "../_shared/auvo-auth.ts";
import { TaskData, getMonthBounds, calculateTaskHours, SAO_PAULO_OFFSET } from "../_shared/auvo-calculations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGE_SIZE = 50;

function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

async function fetchAllTasks(userId: number, startDate: Date, endDate: Date): Promise<TaskData[]> {
  const tasks: TaskData[] = [];
  let page = 1;
  const maxPages = 50;
  while (page <= maxPages) {
    const filter = JSON.stringify({
      startDate: fmtDate(startDate),
      endDate: fmtDate(endDate),
      idUserTo: userId,
    });
    const raw = (await auvoFetch(
      `/tasks/?paramFilter=${encodeURIComponent(filter)}&page=${page}&pageSize=${PAGE_SIZE}&order=asc`
    )) as { result: { entityList?: TaskData[]; content?: TaskData[]; pagedSearchReturnData?: { totalPages?: number }; totalPages?: number } };
    const content = raw?.result?.entityList || raw?.result?.content || [];
    tasks.push(...content);

    if (content.length === 0) break;
    const totalPages = raw?.result?.pagedSearchReturnData?.totalPages || raw?.result?.totalPages || 1;
    if (page >= totalPages && content.length < PAGE_SIZE) break;
    page++;
  }
  return tasks;
}

function filterCrossMonthTasks(
  prevTasks: TaskData[],
  currentMonthTasks: TaskData[],
  monthStart: Date,
  oneMonthBack: Date
): TaskData[] {
  return prevTasks.filter((t) => {
    if (currentMonthTasks.some((ct) => ct.taskID === t.taskID)) return false;

    const checkin = t.checkInDate ? new Date(t.checkInDate) : null;
    const taskDate = checkin || new Date(0);
    const isRecentTask = taskDate >= oneMonthBack;

    if (t.taskStatus === 3 && checkin && isRecentTask) return true;

    if (t.checkOutDate) {
      const checkout = new Date(t.checkOutDate);
      return !isNaN(checkout.getTime()) && checkout > monthStart;
    }

    if (t.taskStatus === 6 && checkin && isRecentTask && t.durationDecimal) return true;

    return false;
  });
}

async function processEmployee(
  supabase: ReturnType<typeof createClient>,
  mapping: { auvo_user_id: number; employee_id: string },
  monthKey: string,
  monthStart: Date,
  monthEnd: Date,
  lookbackStart: Date,
  oneMonthBack: Date,
  now: Date
): Promise<{ tasksProcessed: number }> {
  const currentMonthTasks = await fetchAllTasks(mapping.auvo_user_id, monthStart, monthEnd);
  const prevTasks = await fetchAllTasks(mapping.auvo_user_id, lookbackStart, monthStart);
  const crossMonthTasks = filterCrossMonthTasks(prevTasks, currentMonthTasks, monthStart, oneMonthBack);
  const allTasks = [...currentMonthTasks, ...crossMonthTasks];

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

  // Upsert into horas_trabalhadas
  const { data: existing } = await supabase
    .from("horas_trabalhadas")
    .select("id")
    .eq("employee_id", mapping.employee_id)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (existing) {
    await supabase.from("horas_trabalhadas").update({ horas: totalHours }).eq("id", existing.id);
  } else {
    await supabase.from("horas_trabalhadas").insert({
      employee_id: mapping.employee_id,
      month_key: monthKey,
      horas: totalHours,
    });
  }

  return { tasksProcessed: allTasks.length };
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
      if (logId) {
        await supabase
          .from("auvo_sync_log")
          .update({
            finished_at: new Date().toISOString(),
            status: "skipped",
            errors: [{ message: "No user mappings configured" }],
          })
          .eq("id", logId);
      }
      console.log(`Sync ${monthKey}: skipped — no user mappings configured`);
      return new Response(
        JSON.stringify({ status: "skipped", message: "No user mappings configured", monthKey }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { start: monthStart, end: monthEnd } = getMonthBounds(monthKey);
    const errors: unknown[] = [];
    let totalTasksProcessed = 0;
    let employeesUpdated = 0;

    const [pYear, pMonth] = monthKey.split("-").map(Number);
    const lookbackStart = new Date(Date.UTC(pYear, pMonth - 4, 1, -SAO_PAULO_OFFSET, 0, 0));
    const oneMonthBack = new Date(Date.UTC(pYear, pMonth - 2, 1, -SAO_PAULO_OFFSET, 0, 0));

    for (const mapping of mappings) {
      try {
        const result = await processEmployee(
          supabase, mapping, monthKey, monthStart, monthEnd, lookbackStart, oneMonthBack, now
        );
        totalTasksProcessed += result.tasksProcessed;
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
