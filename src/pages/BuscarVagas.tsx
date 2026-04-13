import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface VagaDisponivel {
  vaga_id: string;
  disponibilidade_id: string;
  codigo_vaga: string | null;
  bloco: string | null;
  unidade: string | null;
  owner_email?: string | null;
  data_inicio: string;
  data_fim: string;
  valor_cobrado: number | null;
  status_disponibilidade: string;
}

const BuscarVagas = () => {
  const { profile, user } = useAuth();
  const [vagas, setVagas] = useState<VagaDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroData, setFiltroData] = useState('');
  const [reservando, setReservando] = useState<string | null>(null);
  const [pagamento, setPagamento] = useState<any>(null);
  const [tempoRestante, setTempoRestante] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!pagamento || !pagamento.expira_em) {
      setTempoRestante('Calculando...');
      return;
    }

    const atualizarContador = () => {
      const agora = new Date().getTime();
      const expiraEm = pagamento?.expira_em
        ? new Date(pagamento.expira_em).getTime()
        : 0;

      const diff = expiraEm - agora;

      if (diff <= 0) {
        setTempoRestante('Expirado');
        return;
      }

      const minutos = Math.floor(diff / 1000 / 60);
      const segundos = Math.floor((diff / 1000) % 60);

      setTempoRestante(
        `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      );
    };

    atualizarContador();
    const interval = setInterval(atualizarContador, 1000);

    return () => clearInterval(interval);
  }, [pagamento]);

  const fetchVagas = async () => {
    setLoading(true);

    try {
      await supabase.functions.invoke('expire-pending-reservations');

      let query = supabase.from('vagas_disponiveis').select('*');

      if (filtroData) {
        const startOfDay = new Date(filtroData);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(filtroData);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('data_inicio', startOfDay.toISOString())
          .lte('data_inicio', endOfDay.toISOString());
      }

      const { data, error } = await query.order('data_inicio', {
        ascending: true,
      });

      if (error) {
        toast.error('Erro ao buscar vagas: ' + error.message);
        return;
      }

      setVagas((data ?? []) as VagaDisponivel[]);
    } catch (err) {
      console.error('ERRO INESPERADO FETCH VAGAS:', err);
      toast.error(
        'Erro inesperado ao buscar vagas: ' +
          (err instanceof Error ? err.message : 'erro desconhecido')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVagas();
  }, []);





const handleReservar = async (vaga: VagaDisponivel) => {
  if (!profile || !user?.email) return;

  console.log('1. OBJETO VAGA:', vaga);

  if (
    vaga.owner_email &&
    vaga.owner_email.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    toast.error('Você não pode reservar a sua própria vaga.');
    return;
  }

  if (vaga.valor_cobrado === null || vaga.valor_cobrado === undefined) {
    toast.error('Essa vaga não possui valor configurado.');
    return;
  }

  const inicioReserva = vaga.data_inicio;
  const fimReserva = vaga.data_fim;

  if (!inicioReserva || !fimReserva) {
    toast.error('Não foi possível identificar o período da reserva.');
    return;
  }

  const inicioDate = new Date(inicioReserva);
  const fimDate = new Date(fimReserva);

  if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) {
    console.error('Datas inválidas:', {
      inicioReserva,
      fimReserva,
      vaga,
    });
    toast.error('As datas da reserva estão inválidas.');
    return;
  }

  const diffMs = fimDate.getTime() - inicioDate.getTime();

  if (diffMs <= 0) {
    console.error('Período inválido:', {
      inicioReserva,
      fimReserva,
      vaga,
    });
    toast.error('O período da reserva é inválido.');
    return;
  }

  const diffHoras = Math.ceil(diffMs / (1000 * 60 * 60));
  const valorUnitario = Number(vaga.valor_cobrado);

  if (isNaN(valorUnitario) || valorUnitario <= 0) {
    toast.error('O valor da vaga está inválido.');
    return;
  }

  const valorTotal = diffHoras * valorUnitario;

  setReservando(vaga.disponibilidade_id);

  try {
    console.log('vaga_id', vaga.vaga_id);
    console.log('disponibilidade_id', vaga.disponibilidade_id);
    console.log('usuario_reservante_id', profile.id);
    console.log('inicio_reserva', inicioReserva);
    console.log('fim_reserva', fimReserva);
    console.log('valor_total', valorTotal);
    console.log('valor_unitario', valorUnitario);

    console.log('CHEGUEI ANTES DA EDGE FUNCTION');

    const { data, error } = await supabase.functions.invoke(
      'create-reservation-payment-asaas',
      {
        body: {
          valor: valorTotal,
          descricao: 'Reserva de vaga',
          vaga_id: vaga.vaga_id,
          disponibilidade_id: vaga.disponibilidade_id,
          usuario_reservante_id: profile.id,
          inicio_reserva: inicioReserva,
          fim_reserva: fimReserva,
          valor_total: valorTotal,
          valor_hora_aplicado: valorUnitario,
        },
      }
    );

    console.log('VOLTEI DA EDGE FUNCTION');
    console.log('DATA PAGAMENTO:', data);
    console.log('ERROR PAGAMENTO:', error);

    if (error) {
      console.error('Erro ao invocar function:', error);
      toast.error('Erro ao iniciar o pagamento.');
      return;
    }

    if (!data) {
      console.error('Resposta vazia da function');
      toast.error('Não foi possível iniciar o pagamento.');
      return;
    }

    setPagamento({
      reserva_id: data.reserva_id ?? null,
      valor_total: data.valor ?? valorTotal,
      pix_copia_cola: data.pix_copia_cola ?? '',
      qr_code: data.qr_code ?? '',
      expira_em: data.expira_em ?? null,
    });

    toast.success(
      `Pagamento iniciado! Valor: ${Number(data.valor ?? valorTotal).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}`
    );




    await fetchVagas();
    navigate('/historico');
  } catch (err) {
    console.error('ERRO INESPERADO RESERVA:', err);
    toast.error('Erro inesperado ao iniciar pagamento');
  } finally {
    setReservando(null);
  }
};





  return (
    <AppLayout>
      {pagamento && (
        <Card className="mb-4 border-primary">
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                Pagamento pendente
              </h3>
              <p className="text-sm text-muted-foreground">
                Conclua o pagamento para confirmar sua reserva.
              </p>
            </div>

            <div className="text-sm">
              <strong>Valor:</strong> R$ {pagamento.valor_total}
            </div>

            <div className="text-sm">
              <strong>Tempo restante para pagamento:</strong>{' '}
              {tempoRestante || 'Calculando...'}
            </div>

            <div className="text-sm">
              <strong>Pix copia e cola:</strong>
              <div className="mt-1 rounded-md bg-muted p-2 break-all text-xs">
                {pagamento.pix_copia_cola}
              </div>
            </div>

            {pagamento?.qr_code && (
              <div className="mt-3 flex justify-center">
                <img
                  src={`data:image/png;base64,${pagamento.qr_code}`}
                  alt="QR Code Pix"
                  className="w-40 h-40"
                />
              </div>
            )}

            
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={async () => {
                  try {
                    await supabase
                      .from('reservas')
                      .update({
                        status_pagamento: 'pago',
                        status: 'confirmada',
                      })
                      .eq('id', pagamento?.reserva_id)

                    toast.success('Pagamento simulado com sucesso')
                  } catch (err) {
                    console.error(err)
                    toast.error('Erro ao simular pagamento')
                  }
                }}
              >
                Simular pagamento (DEV)
              </Button>


          </CardContent>
        </Card>
      )}

      <h1 className="text-xl font-heading font-bold text-foreground mb-4">
        Buscar Vagas
      </h1>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="hero"
            size="sm"
            className="w-full"
            onClick={fetchVagas}
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {vagas.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Nenhuma vaga disponível no momento
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vagas.map((vaga) => {
            const inicio = new Date(vaga.data_inicio);
            const fim = new Date(vaga.data_fim);

            const diffMs = fim.getTime() - inicio.getTime();
            const diffHoras = diffMs / (1000 * 60 * 60);

            return (
              <Card
                key={vaga.disponibilidade_id}
                className="shadow-card hover:shadow-card-hover transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">
                        Disponível no horário
                      </h3>

                      {vaga.bloco && (
                        <p className="text-xs text-muted-foreground">
                          Bloco {vaga.bloco} • Unid. {vaga.unidade}
                        </p>
                      )}

                      {vaga.codigo_vaga && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Vaga {vaga.codigo_vaga}
                        </p>
                      )}
                    </div>

                    <Badge
                      variant="secondary"
                      className="bg-accent text-accent-foreground"
                    >
                      Disponível
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    {inicio.toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                    {' → '}
                    {fim.toLocaleString('pt-BR', {
                      timeStyle: 'short',
                    })}
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    {diffHoras.toFixed(0)} hora{diffHoras > 1 ? 's' : ''}
                  </div>

                  {vaga.valor_cobrado !== null && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-foreground">
                      R$ {vaga.valor_cobrado.toFixed(2)} / hora
                    </div>

                    <div className="text-sm font-bold text-foreground">
                      Total: {(diffHoras * vaga.valor_cobrado).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>
                )}

                  

                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    onClick={() => handleReservar(vaga)}
                    disabled={reservando === vaga.disponibilidade_id}
                  >
                    {reservando === vaga.disponibilidade_id
                      ? 'Reservando...'
                      : 'Reservar'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default BuscarVagas;