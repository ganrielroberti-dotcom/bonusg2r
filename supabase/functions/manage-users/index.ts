import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated gestor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is gestor
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "gestor") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { action, userId, email } = await req.json();

    switch (action) {
      case "list": {
        // Get all employees
        const { data: employees } = await adminClient
          .from("employees")
          .select("id, name, email, role");

        // Get all auth users
        const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({
          perPage: 1000,
        });

        // Get all profiles
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, email, display_name");

        // Map employees to their auth status
        const result = (employees || []).map((emp) => {
          const authUser = authUsers?.find((u) => u.email === emp.email);
          const profile = profiles?.find((p) => p.email === emp.email);

          return {
            employeeId: emp.id,
            employeeName: emp.name,
            employeeEmail: emp.email,
            employeeRole: emp.role,
            hasAccount: !!authUser,
            authUserId: authUser?.id || null,
            lastSignIn: authUser?.last_sign_in_at || null,
            createdAt: authUser?.created_at || null,
            isBanned: authUser?.banned_until
              ? new Date(authUser.banned_until) > new Date()
              : false,
            bannedUntil: authUser?.banned_until || null,
            emailConfirmed: authUser?.email_confirmed_at ? true : false,
          };
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset-password": {
        if (!email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate password reset link
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: "Link de reset enviado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "ban": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "UserId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Ban for 100 years (effectively permanent)
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: "876000h",
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unban": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "UserId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
