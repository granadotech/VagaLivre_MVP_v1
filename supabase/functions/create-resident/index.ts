import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, email, password } = await req.json()

    const emailNormalizado = String(email || '').trim().toLowerCase()
    const nomeTratado = String(nome || '').trim()
    const senha = String(password || '')

    if (!nomeTratado || !emailNormalizado || !senha) {
      return new Response(
        JSON.stringify({ error: 'Preencha nome, email e senha.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailNormalizado)) {
      return new Response(
        JSON.stringify({ error: 'Informe um email válido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('LEGACY_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 1) validar vaga vinculada
    const { data: vaga, error: vagaError } = await adminClient
      .from('vagas')
      .select('id, condominio_id, owner_email')
      .eq('owner_email', emailNormalizado)
      .maybeSingle()

    if (vagaError) {
      return new Response(
        JSON.stringify({ error: `Erro ao validar vínculo da vaga: ${vagaError.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!vaga) {
      return new Response(
        JSON.stringify({
          error:
            'Este email não está vinculado a nenhuma vaga cadastrada. Fale com a administração do condomínio.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2) evitar duplicidade de perfil
    const { data: perfilExistente } = await adminClient
      .from('usuarios')
      .select('id')
      .eq('email', emailNormalizado)
      .maybeSingle()

    if (perfilExistente) {
      return new Response(
        JSON.stringify({ error: 'Já existe um perfil cadastrado para este email.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 3) criar usuário no Auth
    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: emailNormalizado,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: nomeTratado },
      })

    if (createUserError || !createdUser.user?.id) {
      return new Response(
        JSON.stringify({
          error: createUserError?.message || 'Não foi possível criar o usuário no Auth.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const authUserId = createdUser.user.id

    // 4) criar perfil em usuarios
    const { error: profileError } = await adminClient.from('usuarios').insert({
      auth_user_id: authUserId,
      nome: nomeTratado,
      email: emailNormalizado,
      role: 'resident',
      condominio_id: vaga.condominio_id,
    })

    if (profileError) {
      // rollback do auth user se o perfil falhar
      await adminClient.auth.admin.deleteUser(authUserId)

      return new Response(
        JSON.stringify({
          error: `Conta criada no Auth, mas houve erro ao criar perfil: ${profileError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Morador criado com sucesso.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
