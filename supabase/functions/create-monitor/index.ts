// Backend function: create-monitor
// Creates an auth user + profile + assigns 'monitor' role without switching the current session.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

type CreateMonitorBody = {
  username: string;
  full_name: string;
  password: string;
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      ...(init.headers ?? {}),
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing backend configuration" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") ?? "";

    // Client bound to caller session (RLS applies)
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify caller is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    if (rolesError) {
      return json({ error: "Failed to verify role" }, { status: 500 });
    }

    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Partial<CreateMonitorBody>;
    const username = (body.username ?? "").trim().toLowerCase();
    const full_name = (body.full_name ?? "").trim();
    const password = body.password ?? "";

    if (!username || !full_name || !password) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return json({ error: "Invalid username" }, { status: 400 });
    }

    if (password.length < 6) {
      return json({ error: "Password too short" }, { status: 400 });
    }

    const email = `${username}@cmto.interno`;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      return json({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
    }

    const newUserId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      email,
      nome: full_name,
    });

    if (profileError) {
      return json({ error: profileError.message }, { status: 400 });
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUserId,
      role: "monitor",
    });

    if (roleError) {
      return json({ error: roleError.message }, { status: 400 });
    }

    return json({ ok: true, user_id: newUserId, email });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error" }, { status: 500 });
  }
});
