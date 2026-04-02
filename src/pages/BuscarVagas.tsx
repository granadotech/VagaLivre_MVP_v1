import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface VagaDisponivel {
  vaga_id: string;
  identificacao: string;
  bloco: string | null;
  unidade: string | null;
  disponibilidade_id: string;
  data_inicio: string;
  data_fim: string;
  proprietario_nome: string | null;
  owner_email?: string | null;
}

  const BuscarVagas = () => {
  const { profile, user } = useAuth();
  const [vagas, setVagas] = useState<VagaDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroData, setFiltroData] = useState('');
  const [reservando, setReservando] = useState<string | null>(null);


 const fetchVagas = async () => {
  setLoading(true);

  try {
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

    const { data, error } = await query.order('data_inicio', { ascending: true });

    console.log('FILTRO DATA:', filtroData);
    console.log('QUERY RESULT DATA:', data);
    console.log('QUERY RESULT ERROR:', error);

    if (error) {
      toast.error('Erro ao buscar vagas: ' + error.message);
      return;
    }

    setVagas((data ?? []) as unknown as VagaDisponivel[]);
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

  console.log('USER EMAIL:', user?.email);
  console.log('OWNER EMAIL:', vaga.owner_email);

  if (
    vaga.owner_email &&
    user?.email &&
    vaga.owner_email.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    toast.error('Você não pode reservar a sua própria vaga.');
    return;
  }

  setReservando(vaga.disponibilidade_id);

  const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from('reservas').insert({
    vaga_id: vaga.vaga_id,
    disponibilidade_id: vaga.disponibilidade_id,
    usuario_reservante_id: profile.id,
    inicio_reserva: vaga.data_inicio,
    fim_reserva: vaga.data_fim,
    status: 'confirmada',
    codigo_autorizacao: codigo,
  } as any);

  if (error) {
    toast.error('Erro ao reservar: ' + error.message);
  } else {
    toast.success(`Vaga reservada! Código: ${codigo}`);
    fetchVagas();
  }

  setReservando(null);
};

  return (
    <AppLayout>
      <h1 className="text-xl font-heading font-bold text-foreground mb-4">Buscar Vagas</h1>

      {/* Filters */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
            </div>
          </div>
          <Button variant="hero" size="sm" className="w-full" onClick={fetchVagas} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {vagas.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma vaga disponível no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vagas.map((vaga) => (
            <Card key={vaga.disponibilidade_id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">
                      {vaga.identificacao}
                    </h3>
                    {vaga.bloco && (
                      <p className="text-xs text-muted-foreground">Bloco {vaga.bloco} • Unid. {vaga.unidade}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    Disponível
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  {new Date(vaga.data_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {' → '}
                  {new Date(vaga.data_fim).toLocaleString('pt-BR', { timeStyle: 'short' })}
                </div>


                <Button
                  variant="hero"
                  size="sm"
                  className="w-full"
                  onClick={() => handleReservar(vaga)}
                  disabled={reservando === vaga.disponibilidade_id}
                >
                  {reservando === vaga.disponibilidade_id ? 'Reservando...' : 'Reservar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default BuscarVagas;
