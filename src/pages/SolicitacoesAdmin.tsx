import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type SolicitacaoAdmin = {
  id: string;
  nome: string;
  email: string;
  celular: string | null;
  nome_condominio: string;
  cidade: string | null;
  estado: string | null;
  total_vagas_estimado: number | null;
  perfil_solicitante: 'sindico' | 'subsindico' | 'administradora' | 'morador' | null;
  mensagem: string | null;
  status: 'pendente' | 'aprovado' | 'recusado';
  trial_ativo: boolean;
  trial_inicio: string | null;
  trial_fim: string | null;
  created_at: string;
};

const SolicitacoesAdmin = () => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log('SESSION:', session);


      const { data, error } = await supabase
        .from('solicitacoes_admin')
        .select('*')
        .order('created_at', { ascending: false });

        console.log('SOLICITACOES DATA:', data);
        console.log('SOLICITACOES ERROR:', error);

      if (error) throw error;

      setSolicitacoes((data as SolicitacaoAdmin[]) ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar solicitações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

 const aprovarSolicitacao = async (id: string) => {
  try {
    setUpdatingId(id);

    const { data, error } = await supabase.functions.invoke(
      'approve-admin-request',
      {
        body: { solicitacao_id: id },
      }
    );

    if (error) {
      let mensagem = 'Erro ao aprovar solicitação.';

      try {
        const detalhes = await error.context.json();

        if (detalhes?.error) {
          mensagem = detalhes.error;
        }
      } catch (e) {
        console.error('Erro ao ler resposta da function');
      }

      toast.error(mensagem);
      return;
    }

    toast.success('Solicitação aprovada com sucesso.');
    fetchSolicitacoes();
  } catch (error: any) {
    toast.error('Erro inesperado: ' + error.message);
  } finally {
    setUpdatingId(null);
  }
};

  const recusarSolicitacao = async (id: string) => {
    try {
      setUpdatingId(id);

      const { error } = await supabase
        .from('solicitacoes_admin')
        .update({
          status: 'recusado',
          trial_ativo: false,
          trial_inicio: null,
          trial_fim: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Solicitação recusada.');
      fetchSolicitacoes();
    } catch (error: any) {
      toast.error('Erro ao recusar solicitação: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusVariant = (status: SolicitacaoAdmin['status']) => {
    if (status === 'aprovado') return 'default';
    if (status === 'recusado') return 'destructive';
    return 'secondary';
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-heading font-bold text-foreground">
          Solicitações de acesso
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aprove ou recuse os pedidos para cadastro de condomínio.
        </p>
      </div>

      {loading ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Carregando solicitações...
          </CardContent>
        </Card>
      ) : solicitacoes.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            Nenhuma solicitação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map((item) => (
            <Card key={item.id} className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                  </div>

                  <Badge variant={statusVariant(item.status) as any}>
                    {item.status}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Condomínio:</strong> {item.nome_condominio}</p>
                  <p><strong>Cidade/Estado:</strong> {[item.cidade, item.estado].filter(Boolean).join(' / ') || '-'}</p>
                  <p><strong>Celular:</strong> {item.celular || '-'}</p>
                  <p><strong>Vagas estimadas:</strong> {item.total_vagas_estimado ?? '-'}</p>
                  <p><strong>Perfil:</strong> {item.perfil_solicitante || '-'}</p>
                  <p><strong>Mensagem:</strong> {item.mensagem || '-'}</p>
                  <p><strong>Trial ativo:</strong> {item.trial_ativo ? 'Sim' : 'Não'}</p>
                  <p>
                    <strong>Validade:</strong>{' '}
                    {item.trial_fim
                      ? new Date(item.trial_fim).toLocaleString('pt-BR')
                      : '-'}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="hero"
                    onClick={() => aprovarSolicitacao(item.id)}
                    disabled={updatingId === item.id}
                  >
                    {updatingId === item.id ? 'Processando...' : 'Aprovar'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => recusarSolicitacao(item.id)}
                    disabled={updatingId === item.id}
                  >
                    Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default SolicitacoesAdmin;