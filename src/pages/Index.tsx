import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ParkingSquare, Clock, Car } from 'lucide-react';
import heroImg from '@/assets/hero-parking.jpg';

const Index = () => {
  const { profile } = useAuth();
  const [reservasAtivas, setReservasAtivas] = useState(0);
  const [vagasDisponiveis, setVagasDisponiveis] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return;
      const { count: resCount } = await supabase
        .from('reservas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .in('status', ['confirmada', 'em_uso']);
      setReservasAtivas(resCount ?? 0);

      const { count: vagasCount } = await supabase
        .from('vagas_disponiveis')
        .select('*', { count: 'exact', head: true });
      setVagasDisponiveis(vagasCount ?? 0);
    };
    fetchStats();
  }, [profile]);

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 -mx-1">
        <img src={heroImg} alt="Estacionamento" width={1280} height={720} className="w-full h-40 object-cover" />
        <div className="absolute inset-0 gradient-hero flex flex-col justify-end p-5">
          <h1 className="text-xl font-heading font-bold text-primary-foreground">
            Olá, {profile?.nome?.split(' ')[0] ?? 'Morador'}!
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Sua vaga parada pode virar solução
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Car className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vagasDisponiveis}</p>
              <p className="text-xs text-muted-foreground">Vagas disponíveis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{reservasAtivas}</p>
              <p className="text-xs text-muted-foreground">Reservas ativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link to="/buscar">
          <Button variant="hero" size="lg" className="w-full justify-start gap-3 h-14 rounded-xl text-base">
            <Search className="h-5 w-5" />
            Buscar vaga disponível
          </Button>
        </Link>

        {(profile?.role === 'owner' || profile?.role === 'admin') && (
          <Link to="/minhas-vagas">
            <Button variant="outline" size="lg" className="w-full justify-start gap-3 h-14 rounded-xl text-base mt-3">
              <ParkingSquare className="h-5 w-5" />
              Disponibilizar minha vaga
            </Button>
          </Link>
        )}

        <Link to="/historico">
          <Button variant="outline" size="lg" className="w-full justify-start gap-3 h-14 rounded-xl text-base mt-3">
            <Clock className="h-5 w-5" />
            Minhas reservas
          </Button>
        </Link>
      </div>

      {/* Active Reservations Preview */}
      {reservasAtivas > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-heading font-semibold text-foreground mb-3">Reservas ativas</h2>
          <ActiveReservations userId={profile?.id} />
        </div>
      )}
    </AppLayout>
  );
};

const ActiveReservations: React.FC<{ userId?: string }> = ({ userId }) => {
  const [reservas, setReservas] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('reservas')
      .select('*, vagas(identificacao, bloco)')
      .eq('user_id', userId)
      .in('status', ['confirmada', 'em_uso'])
      .order('inicio', { ascending: true })
      .limit(3)
      .then(({ data }) => setReservas(data ?? []));
  }, [userId]);

  return (
    <div className="space-y-2">
      {reservas.map((r) => (
        <Card key={r.id} className="shadow-card">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">
                Vaga {(r.vagas as any)?.identificacao}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {' → '}
                {new Date(r.fim).toLocaleString('pt-BR', { timeStyle: 'short' })}
              </p>
            </div>
            <Badge variant={r.status === 'em_uso' ? 'default' : 'secondary'}>
              {r.status === 'em_uso' ? 'Em uso' : 'Confirmada'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Index;
