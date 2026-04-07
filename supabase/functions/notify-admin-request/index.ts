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
    const rawBody = await req.text()

    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: 'Body vazio na requisição.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const {
      nome,
      email,
      celular,
      nome_condominio,
      cidade,
      estado,
      total_vagas_estimado,
      perfil_solicitante,
      mensagem,
    } = JSON.parse(rawBody)

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const html = `
      <h2>Nova solicitação de acesso administrativo</h2>
      <p><strong>Nome:</strong> ${nome || '-'}</p>
      <p><strong>Email:</strong> ${email || '-'}</p>
      <p><strong>Celular:</strong> ${celular || '-'}</p>
      <p><strong>Condomínio:</strong> ${nome_condominio || '-'}</p>
      <p><strong>Cidade:</strong> ${cidade || '-'}</p>
      <p><strong>Estado:</strong> ${estado || '-'}</p>
      <p><strong>Total de vagas:</strong> ${total_vagas_estimado || '-'}</p>
      <p><strong>Perfil:</strong> ${perfil_solicitante || '-'}</p>
      <p><strong>Mensagem:</strong> ${mensagem || '-'}</p>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vaga Livre <onboarding@resend.dev>',
        to: ['tatianagranado@gmail.com'],
        subject: 'Nova solicitação de acesso | Vaga Livre',
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})