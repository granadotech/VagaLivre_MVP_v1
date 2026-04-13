import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ParkingSquare, Plus, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Vaga = {
  id: string;
  identificacao: string | null;
  bloco: string | null;
  unidade: string | null;
  ativo: boolean | null;
  owner_email?: string | null;
};

type Disponibilidade = {
  id: string;
  vaga_id: string;
  data_inicio: string;
  data_fim: string;
  recorrente: boolean | null;
  status: 'ativa' | 'cancelada' | 'encerrada';
  criada_por_usuario_id?: string | null;
  vagas?: {
    identificacao?: string | null;
  } | null;
  reservas?: {
    id: string;
    status: string;
  }[] | null;
};

const MinhasVagas = () => {
  const { profile, user } = useAuth();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([]);
  const [selectedVaga, setSelectedVaga] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [valorCobrado, setValorCobrado] = useState('');

  const resetDialogState = () => {
    setDialogOpen(false);
    setSelectedVaga(null);
    setInicio('');
    setFim('');
    setRecorrente(false);
  };

  const abrirDisponibilizacao = (vagaId: string) => {
    setSelectedVaga(vagaId);
    setDialogOpen(true);
  };

  const fetchVagas = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from('vagas')
      .select('*')
      .eq('owner_email', user.email.trim().toLowerCase());

    if (error) {
      toast.error('Erro ao buscar vagas: ' + error.message);
      return;
    }

    setVagas((data as Vaga[]) ?? []);
  };

    const fetchDisponibilidades = async () => {
      if (!profile) return;

    const result = await (supabase
          .from('disponibilidades_vaga' as any)
          .select(`
            id,
            vaga_id,
            data_inicio,
            data_fim,
            recorrente,
            status,
            criada_por_usuario_id,
            vagas(identificacao),
            valor_cobrado,
            reservas(id, status, disponibilidade_id)
          `)
          .eq('criada_por_usuario_id', profile.id)
          .order('data_inicio', { ascending: true }));

        console.log('DISPONIBILIDADES COM RESERVAS:', result.data);
        console.log('ERRO FETCH DISPONIBILIDADES:', result.error);

        if (result.error) {
          toast.error('Erro ao buscar disponibilidades: ' + result.error.message);
          return;
        }

        setDisponibilidades((result.data as any[]) ?? []);
    };

  useEffect(() => {
    fetchVagas();
    fetchDisponibilidades();
  }, [profile, user]);

  const handleDisponibilizar = async () => {
  if (!selectedVaga) {
    toast.error('Nenhuma vaga foi selecionada');
    return;
  }

  if (!inicio || !fim) {
    toast.error('Preencha início e fim');
    return;
  }

  if (!valorCobrado || Number(valorCobrado) <= 0) {
    toast.error('Informe o valor por hora da vaga.');
    return;
  }

  if (!profile) {
    toast.error('Perfil do usuário não carregado');
    return;
  }

  const inicioDate = new Date(inicio);
  const fimDate = new Date(fim);
  const diffMs = fimDate.getTime() - inicioDate.getTime();

  if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(fimDate.getTime())) {
    toast.error('Preencha datas válidas');
    return;
  }

  if (diffMs < 3600000) {
    toast.error('A duração mínima é de 1 hora');
    return;
  }

  // 🔎 verifica se já existe disponibilidade conflitante para a mesma vaga
 const { data: conflitos, error: conflitoError } = await (supabase
  .from('disponibilidades_vaga' as any)
  .select('id, data_inicio, data_fim, status')
  .eq('vaga_id', selectedVaga)
  .in('status', ['ativa'])
  .lt('data_inicio', fimDate.toISOString())
  .gt('data_fim', inicioDate.toISOString()));

console.log('CONFLITOS ENCONTRADOS:', conflitos);
console.log('ERRO AO BUSCAR CONFLITOS:', conflitoError);

  if (conflitoError) {
    toast.error('Erro ao validar conflito de horário.');
    return;
  }

  if (conflitos && conflitos.length > 0) {
    toast.error('Já existe uma disponibilidade cadastrada para essa vaga nesse período.');
    return;
  }

  const { error } = await supabase.from('disponibilidades_vaga').insert({
    vaga_id: selectedVaga,
    data_inicio: inicioDate.toISOString(),
    data_fim: fimDate.toISOString(),
    recorrente,
    criada_por_usuario_id: profile.id,
    valor_cobrado: Number(valorCobrado),
    status: 'ativa',
  });

  console.log('ERRO INSERT DISPONIBILIDADE:', error);
  console.log('PROFILE.ID:', profile?.id);
  console.log('SELECTED VAGA:', selectedVaga);

  if (error) {
    toast.error('Erro: ' + error.message);
  } else {
    toast.success('Vaga disponibilizada com sucesso!');
    resetDialogState();
    fetchDisponibilidades();
  }
};



const handleCancelarDisponibilidade = async (id: string) => {
  console.log('ID DA DISPONIBILIDADE A CANCELAR:', id);

  const { data, error } = await supabase
    .from('disponibilidades_vaga')
    .update({ 
      status: 'cancelada',
      cancelada_por: 'proprietario'
    } as any)
    .eq('id', id)
    .select();

  console.log('RETORNO UPDATE:', data);

  if (error) {
    console.log('ERRO:', error);
    toast.error('Erro ao cancelar disponibilidade: ' + error.message);
  } else if (!data || data.length === 0) {
    toast.error('Nenhuma linha foi atualizada');
  } else {
    toast.success('Disponibilidade cancelada');
    fetchDisponibilidades();
  }
};

const handleCancelarReserva = async (reservaId: string, inicioReserva: string) => {
  const agora = new Date().getTime();
  const inicio = new Date(inicioReserva).getTime();
  const diferencaMinutos = (inicio - agora) / 60000;

  if (diferencaMinutos < 60) {
    toast.error('A reserva só pode ser cancelada com pelo menos 1 hora de antecedência.');
    return;
  }

  const { error } = await supabase
    .from('reservas')
    .update({
      status: 'cancelada',
      cancelada_por: 'proprietario',
    } as any)
    .eq('id', reservaId);

  if (error) {
    toast.error('Erro ao cancelar reserva: ' + error.message);
  } else {
    toast.success('Reserva cancelada');
    fetchDisponibilidades();
  }
};



  
  const handleRemoverDisp = async (id: string) => {
    const { error } = await supabase
      .from('disponibilidades_vaga')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao remover: ' + error.message);
    } else {
      toast.success('Disponibilidade removida');
      fetchDisponibilidades();
    }
  };

  const getStatusDisponibilidade = (d: Disponibilidade) => {
  const agora = new Date().getTime();
  const fim = new Date(d.data_fim).getTime();

  const temReservaAtiva =
    d.reservas?.some((r) => ['confirmada', 'em_uso'].includes(r.status)) ?? false;

  if (temReservaAtiva) {
    return { label: 'Reservada', variant: 'destructive' as const };
  }

  if (d.status === 'cancelada') {
    return { label: 'Cancelada', variant: 'outline' as const };
  }

  if (fim < agora || d.status === 'encerrada') {
    return { label: 'Encerrada', variant: 'secondary' as const };
  }

  return { label: 'Disponível', variant: 'default' as const };
};

const getReservaAtiva = (d: Disponibilidade) => {
  return d.reservas?.find((r) => ['confirmada', 'em_uso'].includes(r.status)) ?? null;
};


  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-heading font-bold text-foreground">Minhas Vagas</h1>
      </div>

      {vagas.length === 0 ? (
        <div className="text-center py-12">
          <ParkingSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Você não possui vagas vinculadas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Vagas são cadastradas pelo administrador
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {vagas.map((vaga) => (
              <Card key={vaga.id} className="shadow-card">
                <CardContent className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-heading font-semibold text-foreground">
        Vaga {vaga.identificacao}
      </h3>
      <p className="text-xs text-muted-foreground">
        {vaga.bloco ? `Bloco ${vaga.bloco} • ` : ''}
        {vaga.unidade ? `Unid. ${vaga.unidade}` : 'Sem unidade'}
      </p>
    </div>

    <div className="flex items-center gap-2">
      <Badge variant={vaga.ativo ? 'default' : 'secondary'}>
        {vaga.ativo ? 'Ativa' : 'Inativa'}
      </Badge>

      <Dialog
        open={dialogOpen && selectedVaga === vaga.id}
        onOpenChange={(open) => {
          if (open) {
            setSelectedVaga(vaga.id);
            setDialogOpen(true);
          } else {
            resetDialogState();
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="hero"
            disabled={!vaga.ativo}
            onClick={() => abrirDisponibilizacao(vaga.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Disponibilizar Vaga {vaga.identificacao}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Data/Hora início</Label>
              <Input
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data/Hora fim</Label>
              <Input
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorCobrado">Valor por hora *</Label>
              <Input
                id="valorCobrado"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex: 3.00"
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
                required
              />
            </div>

                {/* RECORRENTE NAO ESTA HABILITADO NA TELA 
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={recorrente}
                                onCheckedChange={setRecorrente}
                              />
                              <Label>Recorrente (semanal)</Label>
                            </div>
                */}

                
            <Button
              variant="hero"
              className="w-full"
              onClick={handleDisponibilizar}
            >
              Disponibilizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </div>

  <div className="mt-4 space-y-2">
    {disponibilidades
      .filter((d) => d.vaga_id === vaga.id)
      .map((d) => {
          const status = getStatusDisponibilidade(d);
          const reservaAtiva = getReservaAtiva(d);

          const podeCancelarDisponibilidade = status.label === 'Disponível';
          const podeCancelarReserva =
            status.label === 'Reservada' &&
            !!reservaAtiva;



        return (
          <Card key={d.id} className="border border-border shadow-none">
                    
                    
                   <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(d.data_inicio).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                        {' → '}
                        {new Date(d.data_fim).toLocaleString('pt-BR', {
                          timeStyle: 'short',
                        })}
                      </p>

                      {/* 💰 Valor por hora */}
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor por hora:{' '}
                        <span className="font-medium text-foreground">
                          {d.valor_cobrado !== null && d.valor_cobrado !== undefined
                            ? Number(d.valor_cobrado).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : 'Não informado'}
                        </span>
                      </p>

                      {d.recorrente && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          Recorrente
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>

                      {podeCancelarDisponibilidade && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log('DISPONIBILIDADE CLICADA:', d);
                            handleCancelarDisponibilidade(d.id);
                          }}
                        >
                          Cancelar disponibilidade
                        </Button>
                      )}

                      {podeCancelarReserva && reservaAtiva && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCancelarReserva(reservaAtiva.id, d.data_inicio)
                          }
                        >
                          Cancelar reserva
                        </Button>
                      )}
                    </div>
                  </CardContent>



                  </Card>
                );
              })}

            {disponibilidades.filter((d) => d.vaga_id === vaga.id).length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma disponibilidade criada para esta vaga.
              </p>
            )}
          </div>
        </CardContent>


              </Card>
            ))}
          </div>

          


        </>
      )}
    </AppLayout>
  );
};

export default MinhasVagas;