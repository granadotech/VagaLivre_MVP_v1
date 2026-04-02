import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Plus, Building, Trash2, ParkingSquare } from 'lucide-react';
import { toast } from 'sonner';

type Vaga = {
  id: string;
  identificacao: string;
  bloco: string | null;
  unidade: string | null;
  owner_email?: string | null;
  condominio_id: string;
  ativo: boolean;
};

type Condominio = {
  id: string;
  nome: string;
  endereco: string;
  total_vagas: number;
};

type TorreConfig = {
  id: number;
  nome: string;
  andarInicial: string;
  andarFinal: string;
  aptosPorAndar: string;
  finais: string;
};

const createEmptyTorre = (index: number): TorreConfig => ({
  id: index,
  nome: `Torre ${index}`,
  andarInicial: '',
  andarFinal: '',
  aptosPorAndar: '',
  finais: '1,2,3,4',
});

const Admin = () => {
  const { profile } = useAuth();

  return (
    <AppLayout>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-heading font-bold text-foreground">
            <Settings className="h-5 w-5 inline mr-2" />
            Painel Admin
          </h1>

          <Badge variant="outline">
            Perfil: {profile?.role ?? 'sem perfil'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          Cadastre o condomínio e organize as vagas para viabilizar as reservas.
        </p>
      </div>

      <Tabs defaultValue="condominios">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="condominios" className="text-xs">
            Cond.
          </TabsTrigger>
          <TabsTrigger value="vagas" className="text-xs" disabled={!profile?.condominio_id}>
            Vagas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="condominios">
          <AdminCondominios />
        </TabsContent>

        <TabsContent value="vagas">
          <AdminVagas />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const AdminVagas = () => {
  const { profile } = useAuth();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [ident, setIdent] = useState('');
  const [bloco, setBloco] = useState('');
  const [unidade, setUnidade] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);
  const [emailEdit, setEmailEdit] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const resetForm = () => {
    setIdent('');
    setBloco('');
    setUnidade('');
    setOwnerEmail('');
  };

  const abrirModalEmail = (vaga: Vaga) => {
    setVagaSelecionada(vaga);
    setEmailEdit(vaga.owner_email || '');
    setEmailDialogOpen(true);
  };

  const salvarEmail = async () => {
    if (!vagaSelecionada) return;

  try {
    setSavingEmail(true);

  const emailTratado = emailEdit.trim().toLowerCase();

  const { error } = await supabase
      .from('vagas')
      .update({ owner_email: emailTratado || null })
      .eq('id', vagaSelecionada.id);

    if (error) throw error;

    setVagas((prev) =>
      prev.map((v) =>
        v.id === vagaSelecionada.id
          ? { ...v, owner_email: emailTratado }
          : v
      )
    );

    toast.success('Proprietário vinculado com sucesso.');
    setEmailDialogOpen(false);
  } catch (error: any) {
    toast.error(`Erro ao salvar email: ${error.message}`);
  } finally {
    setSavingEmail(false);
  }
};

  const fetchData = async () => {
    if (!profile?.condominio_id) {
      setVagas([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('condominio_id', profile.condominio_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVagas((data as Vaga[]) ?? []);
    } catch (error: any) {
      toast.error(`Erro ao carregar vagas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.condominio_id]);

  const handleCreate = async () => {
    if (!profile?.condominio_id) {
      toast.error('Admin sem condomínio vinculado.');
      return;
    }

    if (!ident.trim()) {
      toast.error('Preencha a identificação da vaga.');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from('vagas').insert({
        identificacao: ident.trim(),
        bloco: bloco.trim() || null,
        unidade: unidade.trim() || null,
        owner_email: ownerEmail.trim().toLowerCase() || null,
        condominio_id: profile.condominio_id,
        ativo: true,
      });

      if (error) throw error;

      toast.success('Vaga cadastrada com sucesso.');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(`Erro ao cadastrar vaga: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase.from('vagas').update({ ativo: !ativo }).eq('id', id);
      if (error) throw error;

      setVagas((prev) =>
        prev.map((vaga) => (vaga.id === id ? { ...vaga, ativo: !ativo } : vaga))
      );

      toast.success(!ativo ? 'Vaga ativada.' : 'Vaga inativada.');
    } catch (error: any) {
      toast.error(`Erro ao atualizar vaga: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmar = window.confirm(
      'Tem certeza que deseja excluir esta vaga? Essa ação não poderá ser desfeita.'
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase.from('vagas').delete().eq('id', id);
      if (error) throw error;

      setVagas((prev) => prev.filter((vaga) => vaga.id !== id));
      toast.success('Vaga excluída com sucesso.');
    } catch (error: any) {
      toast.error(`Erro ao excluir vaga: ${error.message}`);
    }
  };

  if (!profile?.condominio_id) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Configure o condomínio primeiro para liberar o cadastro de vagas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div>
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <ParkingSquare className="h-4 w-4 text-primary" />
            Vagas
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre e organize as vagas do seu condomínio.
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="hero">
              <Plus className="h-4 w-4 mr-1" />
              Nova Vaga
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Vaga</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div className="space-y-1">
                <Label>Identificação da vaga *</Label>
                <Input
                  value={ident}
                  onChange={(e) => setIdent(e.target.value)}
                  placeholder="Ex: Vaga 202"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Bloco / Torre</Label>
                  <Input
                    value={bloco}
                    onChange={(e) => setBloco(e.target.value)}
                    placeholder="Ex: Torre A"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Unidade / Apto</Label>
                  <Input
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: 202"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Email do responsável</Label>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="Ex: morador@condominio.com"
                />
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Carregando vagas...
          </CardContent>
        </Card>
      ) : vagas.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <ParkingSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhuma vaga cadastrada ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Depois de configurar a estrutura, as vagas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
<div className="space-y-2">
  {vagas.map((v) => (
    <Card key={v.id} className="shadow-card">
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground">
            {v.identificacao || 'Vaga sem identificação'}
          </p>

          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
            {v.bloco ? <span>{v.bloco} •</span> : null}
            {v.unidade ? <span>Apartamento {v.unidade} •</span> : null}

            <button
              type="button"
              className="underline text-primary cursor-pointer hover:opacity-80"
              onClick={() => abrirModalEmail(v)}
            >
              {v.owner_email || 'Sem email vinculado'}
            </button>
          </p>

          <div className="mt-2">
            <Badge variant={v.ativo ? 'default' : 'outline'}>
              {v.ativo ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={v.ativo}
            onCheckedChange={() => toggleAtivo(v.id, v.ativo)}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleDelete(v.id)}
            title="Excluir vaga"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
 <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Proprietário da vaga</DialogTitle>
    </DialogHeader>

    <div className="space-y-3 mt-4">
      <div className="space-y-1">
        <Label>Email do responsável</Label>
        <Input
          type="email"
          value={emailEdit}
          onChange={(e) => setEmailEdit(e.target.value)}
          placeholder="Ex: morador@condominio.com"
        />
      </div>

      <Button
        variant="hero"
        className="w-full"
        onClick={salvarEmail}
        disabled={savingEmail}
      >
        {savingEmail ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  </DialogContent>
</Dialog>

</div>

        
      )}
    </div> 
  );
 
};

const AdminCondominios = () => {
  const { profile } = useAuth();
  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gerarOpen, setGerarOpen] = useState(false);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [totalVagas, setTotalVagas] = useState('');
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [torres, setTorres] = useState<TorreConfig[]>([createEmptyTorre(1)]);

  const fetchData = async () => {
    if (!profile?.condominio_id) {
      setCondominio(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .eq('id', profile.condominio_id)
        .maybeSingle();

      if (error) throw error;

      const registro = (data as Condominio | null) ?? null;
      setCondominio(registro);

      if (registro) {
        setNome(registro.nome ?? '');
        setEndereco(registro.endereco ?? '');
        setTotalVagas(String(registro.total_vagas ?? ''));
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar condomínio: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.condominio_id]);

  const previewUnidades = useMemo(() => {
    const resultado: { bloco: string; unidade: string }[] = [];

    torres.forEach((torre) => {
      const inicio = parseInt(torre.andarInicial, 10);
      const fim = parseInt(torre.andarFinal, 10);
      const qtd = parseInt(torre.aptosPorAndar, 10);

      if (
        Number.isNaN(inicio) ||
        Number.isNaN(fim) ||
        Number.isNaN(qtd) ||
        !torre.finais.trim()
      ) {
        return;
      }

      const finaisArray = torre.finais
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, qtd);

      for (let andar = inicio; andar <= fim; andar++) {
        finaisArray.forEach((final) => {
          resultado.push({
            bloco: torre.nome.trim() || 'Torre',
            unidade: `${andar}${final}`,
          });
        });
      }
    });

    return resultado;
  }, [torres]);

  const updateTorre = (id: number, field: keyof TorreConfig, value: string) => {
    setTorres((prev) =>
      prev.map((torre) => (torre.id === id ? { ...torre, [field]: value } : torre))
    );
  };

  const addTorre = () => {
    setTorres((prev) => [...prev, createEmptyTorre(prev.length + 1)]);
  };

  const removeTorre = (id: number) => {
    if (torres.length === 1) {
      toast.error('É necessário manter pelo menos uma torre.');
      return;
    }

    setTorres((prev) => prev.filter((torre) => torre.id !== id));
  };

  const handleSave = async () => {
    if (!nome.trim() || !endereco.trim() || !totalVagas) {
      toast.error('Preencha todos os campos.');
      return;
    }

    if (!profile?.condominio_id) {
      toast.error('Admin sem condomínio vinculado.');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('condominios')
        .update({
          nome: nome.trim(),
          endereco: endereco.trim(),
          total_vagas: parseInt(totalVagas, 10),
        })
        .eq('id', profile.condominio_id);

      if (error) throw error;

      toast.success('Condomínio atualizado com sucesso.');
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(`Erro ao atualizar condomínio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGerarEstrutura = async () => {
    if (!profile?.condominio_id) {
      toast.error('Admin sem condomínio vinculado.');
      return;
    }

    if (!condominio) {
      toast.error('Configure o condomínio antes de gerar a estrutura.');
      return;
    }

    if (previewUnidades.length === 0) {
      toast.error('Preencha corretamente os dados das torres.');
      return;
    }

    if (previewUnidades.length > condominio.total_vagas) {
      toast.error(
        `A estrutura gerada (${previewUnidades.length}) excede o total de vagas do condomínio (${condominio.total_vagas}).`
      );
      return;
    }

    try {
      setGerando(true);

      const { count, error: countError } = await supabase
        .from('vagas')
        .select('*', { count: 'exact', head: true })
        .eq('condominio_id', profile.condominio_id);

      if (countError) throw countError;

      if ((count ?? 0) > 0) {
        toast.error('Já existem vagas cadastradas para este condomínio.');
        return;
      }

      const payload = previewUnidades.map((item, index) => ({
        identificacao: `Vaga ${index + 1}`,
        bloco: item.bloco,
        unidade: item.unidade,
        owner_email: null,
        condominio_id: profile.condominio_id,
        ativo: true,
      }));

      const { error } = await supabase.from('vagas').insert(payload);
      if (error) throw error;

      toast.success('Estrutura de vagas gerada com sucesso.');
      setGerarOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao gerar todas as vagas: ${error.message}`);
    } finally {
      setGerando(false);
    }
  };

  if (!profile?.condominio_id) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Este admin ainda não possui condomínio vinculado.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          Condomínio
        </h2>

        <div className="flex gap-2">
          <Dialog open={gerarOpen} onOpenChange={setGerarOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="hero">
                Criar todas as vagas
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Configurar Estrutura das Vagas</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {torres.map((torre, index) => (
                  <Card key={torre.id} className="shadow-card">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          Torre {index + 1}
                        </p>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTorre(torre.id)}
                        >
                          Remover
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <Label>Nome da torre</Label>
                        <Input
                          value={torre.nome}
                          onChange={(e) => updateTorre(torre.id, 'nome', e.target.value)}
                          placeholder="Ex: Torre A"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Qual o primeiro andar</Label>
                          <Input
                            type="number"
                            value={torre.andarInicial}
                            onChange={(e) =>
                              updateTorre(torre.id, 'andarInicial', e.target.value)
                            }
                            placeholder="Ex: 11"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Qual o ultimo andar</Label>
                          <Input
                            type="number"
                            value={torre.andarFinal}
                            onChange={(e) =>
                              updateTorre(torre.id, 'andarFinal', e.target.value)
                            }
                            placeholder="Ex: 188"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Quantidade de apartamentos por andar</Label>
                        <Input
                          type="number"
                          value={torre.aptosPorAndar}
                          onChange={(e) =>
                            updateTorre(torre.id, 'aptosPorAndar', e.target.value)
                          }
                          placeholder="Ex: 4"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Finais dos apartamentos</Label>
                        <Input
                          value={torre.finais}
                          onChange={(e) => updateTorre(torre.id, 'finais', e.target.value)}
                          placeholder="Ex: 1,2,3,4"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Ex: 1,2,3,4 → gera 141, 142, 143, 144
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button type="button" variant="outline" className="w-full" onClick={addTorre}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar torre
                </Button>

                <div className="space-y-2">
                  <Label>Prévia da estrutura</Label>
                  <Card className="shadow-card">
                    <CardContent className="p-3 max-h-40 overflow-auto space-y-1">
                      {previewUnidades.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Preencha os dados das torres para visualizar a estrutura.
                        </p>
                      ) : (
                        previewUnidades.slice(0, 20).map((item, index) => (
                          <p
                            key={`${item.bloco}-${item.unidade}-${index}`}
                            className="text-xs text-foreground"
                          >
                            {item.bloco} • {item.unidade}
                          </p>
                        ))
                      )}

                      {previewUnidades.length > 20 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {previewUnidades.length - 20} unidades
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleGerarEstrutura}
                  disabled={gerando}
                >
                  {gerando ? 'Gerando...' : 'Criar todas as Vagas de uma vez'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="hero">
                Editar
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Condomínio</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-4">
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do condomínio"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Endereço *</Label>
                  <Input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Total de vagas *</Label>
                  <Input
                    type="number"
                    value={totalVagas}
                    onChange={(e) => setTotalVagas(e.target.value)}
                    placeholder="Ex: 360"
                  />
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!condominio ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum condomínio carregado para este admin.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm text-foreground">{condominio.nome}</p>
            </div>
            <p className="text-xs text-muted-foreground">{condominio.endereco}</p>
            <Badge variant="outline" className="mt-2 text-[10px]">
              {condominio.total_vagas} vagas
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Admin;