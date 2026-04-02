import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  confirmada: { label: 'Confirmada', variant: 'default' },
  em_uso: { label: 'Em uso', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'outline' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  expirada: { label: 'Expirada', variant: 'outline' },
};

const Historico = () => {
  const { profile } = useAuth();
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarReservas = async () => {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('reservas')
      .select(
        `
        *,
        vagas(identificacao, bloco, unidade)
      `
      )
      .eq('usuario_reservante_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar reservas:', error);
      setReservas([]);
    } else {
      setReservas(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    carregarReservas();
  }, [profile]);

  const agora = new Date();

  const ativas = reservas.filter((r) => {
    const fim = new Date(r.fim_reserva);

    if (['confirmada', 'em_uso'].includes(r.status)) return true;
    if (r.status === 'cancelada' && fim > agora) return true;

    return false;
  });

  const passadas = reservas.filter((r) => {
    const fim = new Date(r.fim_reserva);

    if (['finalizada', 'expirada'].includes(r.status)) return true;
    if (r.status === 'cancelada' && fim <= agora) return true;

    return false;
  });

  const handleCancelarReserva = async (reservaId: string, inicioReserva: string) => {
    const agoraMs = new Date().getTime();
    const inicioMs = new Date(inicioReserva).getTime();
    const diferencaMinutos = (inicioMs - agoraMs) / 60000;

    if (diferencaMinutos < 60) {
      toast.error('A reserva só pode ser cancelada com pelo menos 1 hora de antecedência.');
      return;
    }

    const { error } = await supabase
      .from('reservas')
      .update({ 
        status: 'cancelada',
        cancelada_por: 'usuario'
      })
      .eq('id', reservaId);

    if (error) {
      toast.error('Erro ao cancelar reserva: ' + error.message);
    } else {
      toast.success('Reserva cancelada');
      carregarReservas();
    }
  };

  return (
    <AppLayout>
      <h1 className="text-xl font-heading font-bold text-foreground mb-4">
        Reservas realizadas
      </h1>

      <Tabs defaultValue="ativas">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="ativas">Ativas ({ativas.length})</TabsTrigger>
          <TabsTrigger value="passadas">Passadas ({passadas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ativas">
          <ReservaList
            reservas={ativas}
            loading={loading}
            onCancelarReserva={handleCancelarReserva}
          />
        </TabsContent>

        <TabsContent value="passadas">
          <ReservaList
            reservas={passadas}
            loading={loading}
            onCancelarReserva={handleCancelarReserva}
          />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const ReservaList: React.FC<{
  reservas: any[];
  loading: boolean;
  onCancelarReserva: (reservaId: string, inicioReserva: string) => void;
}> = ({ reservas, loading, onCancelarReserva }) => {
  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Carregando...</p>;
  }

  if (reservas.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhuma reserva encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservas.map((r) => {
        const status = statusMap[r.status] ?? {
          label: r.status,
          variant: 'outline' as const,
        };

        return (
          <Card key={r.id} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">
                    Vaga {(r.vagas as any)?.identificacao}
                  </h3>
                  {(r.vagas as any)?.bloco && (
                    <p className="text-xs text-muted-foreground">
                      Bloco {(r.vagas as any).bloco} • Unid. {(r.vagas as any).unidade}
                    </p>
                  )}
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {new Date(r.inicio_reserva).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
                {' → '}
                {new Date(r.fim_reserva).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>

              {r.status === 'cancelada' && (
                <p className="text-xs text-muted-foreground mb-3">
                  {r.cancelada_por === 'usuario'
                    ? 'Você cancelou essa reserva'
                    : r.cancelada_por === 'proprietario'
                    ? 'Reserva cancelada pelo proprietário'
                    : 'Reserva cancelada'}
                </p>
              )}

              <div className="space-y-2">
                {r.codigo_autorizacao && ['confirmada', 'em_uso'].includes(r.status) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <QrCode className="h-4 w-4" />
                        Ver código de acesso
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Código de Acesso</DialogTitle>
                      </DialogHeader>

                      <div className="text-center py-8">
                        <div className="inline-block bg-muted rounded-2xl p-8 mb-4">
                          <p className="text-4xl font-mono font-bold text-foreground tracking-widest">
                            {r.codigo_autorizacao}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Vaga {(r.vagas as any)?.identificacao}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.inicio_reserva).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                          {' → '}
                          {new Date(r.fim_reserva).toLocaleString('pt-BR', {
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {r.status === 'confirmada' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onCancelarReserva(r.id, r.inicio_reserva)}
                  >
                    Cancelar reserva
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Historico;
