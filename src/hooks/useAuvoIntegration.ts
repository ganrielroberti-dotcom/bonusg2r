import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuvoOSLookupResult, AuvoUserMapping, AuvoSyncLog, AuvoHoursCache, AuvoUser } from "@/types/auvo";
import { toast } from "sonner";

const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callEdgeFunction(fnName: string, action: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${FUNCTION_BASE}/${fnName}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Edge function error: ${res.status}`);
  }

  return res.json();
}

export function useAuvoOSLookup() {
  const [isSearching, setIsSearching] = useState(false);

  const searchOS = useCallback(async (osNumber: string): Promise<AuvoOSLookupResult> => {
    if (!osNumber.trim()) return { found: false };

    setIsSearching(true);
    try {
      const result = await callEdgeFunction("auvo-proxy", "search-task", { osNumber: osNumber.trim() });
      return result as AuvoOSLookupResult;
    } catch (err) {
      console.error("Auvo OS lookup error:", err);
      toast.error("Erro ao buscar OS no Auvo");
      return { found: false };
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { searchOS, isSearching };
}

export function useAuvoUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<AuvoUser[]>([]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callEdgeFunction("auvo-proxy", "list-users");
      setUsers((result.users || []) as AuvoUser[]);
    } catch (err) {
      console.error("Auvo users error:", err);
      toast.error("Erro ao buscar usuários do Auvo");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, isLoading, fetchUsers };
}

export function useAuvoMappings() {
  const [mappings, setMappings] = useState<AuvoUserMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("auvo_user_mapping")
        .select("*")
        .order("auvo_user_name");
      if (error) throw error;
      setMappings((data || []) as unknown as AuvoUserMapping[]);
    } catch (err) {
      console.error("Fetch mappings error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMapping = useCallback(async (auvoUserId: number, auvoUserName: string, employeeId: string) => {
    const { error } = await supabase.from("auvo_user_mapping").insert({
      auvo_user_id: auvoUserId,
      auvo_user_name: auvoUserName,
      employee_id: employeeId,
    });
    if (error) {
      toast.error("Erro ao salvar mapeamento: " + error.message);
      return false;
    }
    toast.success("Mapeamento salvo");
    await fetchMappings();
    return true;
  }, [fetchMappings]);

  const removeMapping = useCallback(async (id: string) => {
    const { error } = await supabase.from("auvo_user_mapping").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover mapeamento");
      return;
    }
    toast.success("Mapeamento removido");
    await fetchMappings();
  }, [fetchMappings]);

  return { mappings, isLoading, fetchMappings, addMapping, removeMapping };
}

