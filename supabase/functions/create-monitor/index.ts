import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Configuração e Autenticação Admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseServiceKey) {
      throw new Error('Configuração de servidor incompleta (Missing Service Key).');
    }

    // Admin client com Service Role (Super Admin)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Parse do Corpo da Requisição
    const { username, full_name, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome de usuário e senha são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Padronização do email interno
    const email = `${username.trim().toLowerCase()}@cmto.interno`;

    // 3. Criar usuário no Auth (auth.admin.createUser)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: full_name }
    });

    if (createError) {
      if (createError.message?.includes('already registered') || createError.status === 422) {
        return new Response(
          JSON.stringify({ error: 'Usuário ou Monitor já cadastrado com este nome.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw createError;
    }

    const userId = authData.user.id;

    try {
      // 4. Inserir Perfil (ETAPA 2 OBRIGATÓRIA)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          nome: full_name
        });

      if (profileError) throw new Error(`Erro ao criar perfil: ${profileError.message}`);

      // 5. Inserir Role "monitor" (ETAPA 3 OBRIGATÓRIA - Apenas após perfil)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'monitor'
        });

      if (roleError) throw new Error(`Erro ao atribuir permissão de monitor: ${roleError.message}`);

    } catch (innerError) {
      // ROLLBACK: Se perfil ou role falharem, removemos o usuário do Auth
      console.error('Erro detectado. Iniciando rollback de usuário...', innerError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw innerError;
    }

    // 6. Retorno de Sucesso padronizado
    return new Response(
      JSON.stringify({ success: true, id: userId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Falha interna no servidor.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
