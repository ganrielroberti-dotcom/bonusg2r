// Auvo API authentication and fetch utilities

const AUVO_BASE = "https://api.auvo.com.br/v2";
const TOKEN_TTL_MS = 25 * 60 * 1000;

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAuvoToken(): Promise<string> {
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

export async function auvoFetch(path: string, retries = 2): Promise<unknown> {
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
