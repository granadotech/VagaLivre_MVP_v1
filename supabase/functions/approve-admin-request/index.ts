import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const { solicitacao_id } = await req.json()

    if (!solicitacao_id) {
      return new Response(
        JSON.stringify({ error: 'solicitacao_id é obrigatório.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    console.log('Buscando solicitação', solicitacao_id)

    const { data: solicitacao, error: erroSolicitacao } = await adminClient
      .from('solicitacoes_admin')
      .select('*')
      .eq('id', solicitacao_id)
      .maybeSingle()

    if (erroSolicitacao || !solicitacao) {
      console.error('Erro ao buscar solicitação:', erroSolicitacao)

      return new Response(
        JSON.stringify({
          error: erroSolicitacao?.message || 'Solicitação não encontrada.',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Solicitação encontrada', solicitacao.email)

    const { data: usuarioExistente } = await adminClient.auth.admin.listUsers()

    const emailJaExiste = usuarioExistente.users.some(
      (u) => u.email?.toLowerCase() === String(solicitacao.email).toLowerCase()
    )

    if (emailJaExiste) {
      return new Response(
        JSON.stringify({
          error: 'Já existe um usuário no Auth com esse email.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: condominio, error: erroCondominio } = await adminClient
      .from('condominios')
      .insert({
        nome: solicitacao.nome_condominio,
        endereco: `${solicitacao.cidade ?? ''} - ${solicitacao.estado ?? ''}`,
        total_vagas: solicitacao.total_vagas_estimado ?? 0,
      })
      .select()
      .single()

    if (erroCondominio || !condominio) {
      console.error('Erro ao criar condomínio:', erroCondominio)

      return new Response(
        JSON.stringify({
          error: erroCondominio?.message || 'Erro ao criar condomínio.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Condomínio criado', condominio.id)

    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(
        solicitacao.email,
        {
          data: {
            nome: solicitacao.nome,
          },
          redirectTo: 'https://vagalivre-mvp-v1.vercel.app/auth',
        }
      )

    if (inviteError || !invitedUser.user?.id) {
      console.error('Erro ao enviar convite no Auth:', inviteError)

      return new Response(
        JSON.stringify({
          error: inviteError?.message || 'Erro ao enviar convite por email.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const authUserId = invitedUser.user.id
    console.log('Convite enviado / usuário auth criado', authUserId)

    const { error: profileError } = await adminClient
      .from('usuarios')
      .insert({
        auth_user_id: authUserId,
        nome: solicitacao.nome,
        email: solicitacao.email,
        role: 'admin',
        condominio_id: condominio.id,
      })

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)

      await adminClient.auth.admin.deleteUser(authUserId)
      await adminClient.from('condominios').delete().eq('id', condominio.id)

      return new Response(
        JSON.stringify({
          error: profileError.message || 'Erro ao criar perfil do admin.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: updateError } = await adminClient
      .from('solicitacoes_admin')
      .update({
        status: 'aprovado',
        trial_ativo: true,
        trial_inicio: new Date().toISOString(),
        trial_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usuario_id: authUserId,
      })
      .eq('id', solicitacao_id)

    if (updateError) {
      console.error('Erro ao atualizar solicitação:', updateError)

      return new Response(
        JSON.stringify({
          error: updateError.message || 'Erro ao atualizar solicitação.',
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
        auth_user_id: authUserId,
        message: 'Solicitação aprovada e convite enviado por email.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Erro interno approve-admin-request:', error)

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