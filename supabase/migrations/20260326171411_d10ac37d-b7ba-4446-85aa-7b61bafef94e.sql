
-- Fix security definer views by recreating them with security_invoker = true
DROP VIEW IF EXISTS public.minhas_vagas;
DROP VIEW IF EXISTS public.vagas_disponiveis;

CREATE VIEW public.minhas_vagas WITH (security_invoker = true) AS
SELECT v.*, d.inicio AS disponivel_inicio, d.fim AS disponivel_fim, d.id AS disponibilidade_id
FROM public.vagas v
LEFT JOIN public.disponibilidades_vaga d ON d.vaga_id = v.id AND d.fim > now()
WHERE v.owner_id = public.get_usuario_id();

CREATE VIEW public.vagas_disponiveis WITH (security_invoker = true) AS
SELECT v.id AS vaga_id, v.identificacao, v.bloco, v.unidade, v.condominio_id,
  d.id AS disponibilidade_id, d.inicio, d.fim,
  u.nome AS proprietario_nome
FROM public.vagas v
JOIN public.disponibilidades_vaga d ON d.vaga_id = v.id
LEFT JOIN public.usuarios u ON u.id = v.owner_id
WHERE v.ativo = true
  AND d.fim > now()
  AND d.inicio <= d.fim
  AND v.condominio_id = public.get_user_condominio_id()
  AND NOT EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.vaga_id = v.id
      AND r.status IN ('confirmada', 'em_uso')
      AND r.inicio < d.fim AND r.fim > d.inicio
  );

-- Fix overly permissive logs insert policy
DROP POLICY "System can insert logs" ON public.logs_auditoria;
CREATE POLICY "Authenticated users can insert logs" ON public.logs_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_usuario_id() OR user_id IS NULL);
