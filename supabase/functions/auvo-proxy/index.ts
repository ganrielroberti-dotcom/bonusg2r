import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AUVO_BASE = "https://api.auvo.com.br/v2";
const TOKEN_TTL_MS = 25 * 60 * 1000; // 25 min (token lasts 30)

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
  if (!token) throw new Error("Auvo login: no accessToken in response");

  cachedToken = token;
  tokenExpiry = Date.now() + TOKEN_TTL_MS;
  return token;
}

interface AuvoListResponse {
  result: {
    entityList?: unknown[];
    content?: unknown[];  // fallback
    pagedSearchReturnData?: { totalPages?: number; currentPage?: number };
    totalPages?: number;  // fallback
  };
}

function extractList(data: AuvoListResponse): { items: unknown[]; totalPages: number } {
  const r = data?.result;
  const items = r?.entityList || r?.content || [];
  const totalPages = r?.pagedSearchReturnData?.totalPages || r?.totalPages || (items.length > 0 ? 1 : 0);
  return { items, totalPages };
}

async function auvoFetch(path: string, retries = 2): Promise<unknown> {
  const token = await getAuvoToken();
  const url = `${AUVO_BASE}${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 1000;
      console.warn(`Rate limited on ${path}, waiting ${wait}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auvo API error [${res.status}] ${path}: ${text}`);
    }

    return await res.json();
  }
  throw new Error(`Auvo API: max retries exceeded for ${path}`);
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function searchTask(body: { osNumber: string }) {
  const supabase = getSupabaseAdmin();
  const { osNumber } = body;
  if (!osNumber) throw new Error("osNumber is required");

  // Check cache first (24h)
  const { data: cached } = await supabase
    .from("auvo_task_cache")
    .select("*")
    .eq("os_number", osNumber)
    .gte("cached_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (cached) {
    return { found: true, task: cached.data, cached: true };
  }

  // Search by externalId first
  const filter = JSON.stringify({ externalId: osNumber });
  const raw = await auvoFetch(
    `/tasks/?paramFilter=${encodeURIComponent(filter)}&page=1&pageSize=1&order=desc`
  );
  const { items } = extractList(raw as AuvoListResponse);
  let task = items[0] as Record<string, unknown> | undefined;

  // If not found by externalId, try by taskID (if numeric)
  if (!task && /^\d+$/.test(osNumber)) {
    try {
      const byId = (await auvoFetch(`/tasks/${osNumber}`)) as { result: Record<string, unknown> };
      if (byId?.result) task = byId.result;
    } catch {
      // not found
    }
  }

  if (!task) {
    return { found: false };
  }

  // Cache the result
  const taskId = task.taskID as number;
  await supabase.from("auvo_task_cache").upsert(
    {
      auvo_task_id: taskId,
      os_number: osNumber,
      data: task,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "auvo_task_id" }
  );

  return { found: true, task, cached: false };
}

async function listTasks(body: { startDate: string; endDate: string; userId?: number }) {
  const { startDate, endDate, userId } = body;
  const allTasks: unknown[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const filter: Record<string, unknown> = { startDate, endDate };
    if (userId) filter.idUserTo = userId;

    const raw = await auvoFetch(
      `/tasks/?paramFilter=${encodeURIComponent(JSON.stringify(filter))}&page=${page}&pageSize=${pageSize}&order=asc`
    );
    const { items, totalPages } = extractList(raw as AuvoListResponse);
    allTasks.push(...items);

    if (page >= totalPages || totalPages === 0) break;
    page++;
  }

  return { tasks: allTasks, count: allTasks.length };
}

async function listUsers() {
  const allUsers: unknown[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const url = `/users/?page=${page}&pageSize=${pageSize}&order=asc`;
    const raw = await auvoFetch(url);
    const { items, totalPages } = extractList(raw as AuvoListResponse);
    console.log(`Users page ${page}: ${items.length} users, totalPages: ${totalPages}`);
    allUsers.push(...items);

    if (page >= totalPages || totalPages === 0) break;
    page++;
  }

  return { users: allUsers, count: allUsers.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    const body = req.method === "POST" ? await req.json() : {};

    let result: unknown;

    switch (action) {
      case "search-task":
        result = await searchTask(body);
        break;
      case "list-tasks":
        result = await listTasks(body);
        break;
      case "list-users":
        result = await listUsers();
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("auvo-proxy error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
