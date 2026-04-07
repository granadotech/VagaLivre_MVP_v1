//import React, { useState } from 'react';
import React, { useEffect, useState } from 'react';
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';


const Auth = () => {
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [solNome, setSolNome] = useState('');
  const [solEmail, setSolEmail] = useState('');
  const [solCelular, setSolCelular] = useState('');
  const [solNomeCondominio, setSolNomeCondominio] = useState('');
  const [solCidade, setSolCidade] = useState('');
  const [solEstado, setSolEstado] = useState('');
  const [solTotalVagas, setSolTotalVagas] = useState('');
  const [solPerfil, setSolPerfil] = useState('');
  const [solMensagem, setSolMensagem] = useState('');


  useEffect(() => {
  const verificarSessao = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      navigate('/');
    }
  };

  verificarSessao();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      navigate('/');
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [navigate]);

  const normalizarEmail = (email: string) => email.trim().toLowerCase();

  const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const resetSolicitacaoForm = () => {
    setSolNome('');
    setSolEmail('');
    setSolCelular('');
    setSolNomeCondominio('');
    setSolCidade('');
    setSolEstado('');
    setSolTotalVagas('');
    setSolPerfil('');
    setSolMensagem('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailNormalizado = normalizarEmail(loginEmail);
    const { error } = await signIn(emailNormalizado, loginPassword);

    if (error) {
      toast.error('Erro ao entrar: ' + error.message);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regNome.trim() || !regEmail.trim() || !regPassword) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      const emailNormalizado = normalizarEmail(regEmail);

      if (!emailValido(emailNormalizado)) {
        toast.error('Informe um email válido.');
        return;
      }

      if (regPassword.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      const { error: signUpError } = await signUp(emailNormalizado, regPassword, {
        nome: regNome.trim(),
      });

      if (signUpError) {
        toast.error('Erro no cadastro: ' + signUpError.message);
        return;
      }

      const { error: signInError } = await signIn(emailNormalizado, regPassword);

      if (signInError) {
        toast.success('Cadastro realizado com sucesso! Agora faça seu login.');
        setRegNome('');
        setRegEmail('');
        setRegPassword('');
        return;
      }

      toast.success('Cadastro realizado com sucesso!');
      setRegNome('');
      setRegEmail('');
      setRegPassword('');
      navigate('/');
    } catch (error: any) {
      toast.error('Erro no cadastro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarAcesso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !solNome.trim() ||
      !solEmail.trim() ||
      !solNomeCondominio.trim() ||
      !solPerfil.trim()
    ) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const emailNormalizado = normalizarEmail(solEmail);

    if (!emailValido(emailNormalizado)) {
      toast.error('Informe um email válido.');
      return;
    }

    try {
      setSolicitando(true);

      const payload = {
        nome: solNome.trim(),
        email: emailNormalizado,
        celular: solCelular.trim() || null,
        nome_condominio: solNomeCondominio.trim(),
        cidade: solCidade.trim() || null,
        estado: solEstado.trim() || null,
        total_vagas_estimado: solTotalVagas ? parseInt(solTotalVagas, 10) : null,
        perfil_solicitante: solPerfil,
        mensagem: solMensagem.trim() || null,
      };

      const { error: insertError } = await supabase
        .from('solicitacoes_admin')
        .insert(payload);

      if (insertError) {
        throw insertError;
      }

      const { error: notifyError } = await supabase.functions.invoke(
        'notify-admin-request',
        { body: payload }
      );

  if (notifyError) {
  console.error('Erro ao enviar notificação por email:', notifyError);

 const { error: notifyError } = await supabase.functions.invoke(
  'notify-admin-request',
  { body: payload }
);

/* Colei aqui */
useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('Login via convite concluído', session)

        window.location.href = '/'
      }
    }
  )

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])

if (notifyError) {
  console.error('Erro ao enviar notificação por email:', notifyError);

  toast.error(
    'Solicitação salva, mas a notificação por email não pôde ser enviada agora.'
  );
} else {
  toast.success(
    'Solicitação enviada com sucesso. Em breve entraremos em contato.'
  );
}


  toast.error(mensagemErro);
} else {
        toast.success(
          'Solicitação enviada com sucesso. Em breve entraremos em contato.'
        );
      }

      setSolicitarOpen(false);
      resetSolicitacaoForm();
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Vaga Livre" width={80} height={80} className="mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Vaga Livre</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sua vaga parada pode virar solução
          </p>
        </div>

        <Card className="shadow-card">
          <Tabs defaultValue="login">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Bem-vindo de volta</CardTitle>
                <CardDescription>Entre com seu email e senha</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Criar conta</CardTitle>
                <CardDescription>
                  Use o mesmo email previamente vinculado à sua vaga pelo administrador
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nome">Nome *</Label>
                    <Input
                      id="reg-nome"
                      value={regNome}
                      onChange={(e) => setRegNome(e.target.value)}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email *</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Senha *</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Criar conta'}
                  </Button>
                </form>

                <div className="mt-6 border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    É síndico ou responsável pelo condomínio?
                  </p>

                  <Dialog open={solicitarOpen} onOpenChange={setSolicitarOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Solicitar acesso
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Solicitar acesso</DialogTitle>
                      </DialogHeader>

                      <form onSubmit={handleSolicitarAcesso} className="space-y-3 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="sol-nome">Nome completo *</Label>
                          <Input
                            id="sol-nome"
                            value={solNome}
                            onChange={(e) => setSolNome(e.target.value)}
                            placeholder="Seu nome"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-email">Email *</Label>
                          <Input
                            id="sol-email"
                            type="email"
                            value={solEmail}
                            onChange={(e) => setSolEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-celular">Celular</Label>
                          <Input
                            id="sol-celular"
                            value={solCelular}
                            onChange={(e) => setSolCelular(e.target.value)}
                            placeholder="(11) 99999-9999"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-condominio">Nome do condomínio *</Label>
                          <Input
                            id="sol-condominio"
                            value={solNomeCondominio}
                            onChange={(e) => setSolNomeCondominio(e.target.value)}
                            placeholder="Ex: Residencial Jardim"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="sol-cidade">Cidade</Label>
                            <Input
                              id="sol-cidade"
                              value={solCidade}
                              onChange={(e) => setSolCidade(e.target.value)}
                              placeholder="Cidade"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="sol-estado">Estado</Label>
                            <Input
                              id="sol-estado"
                              value={solEstado}
                              onChange={(e) => setSolEstado(e.target.value)}
                              placeholder="UF"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-vagas">Quantidade aproximada de vagas</Label>
                          <Input
                            id="sol-vagas"
                            type="number"
                            value={solTotalVagas}
                            onChange={(e) => setSolTotalVagas(e.target.value)}
                            placeholder="Ex: 120"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-perfil">Qual sua função no condomínio? *</Label>
                          <select
                            id="sol-perfil"
                            value={solPerfil}
                            onChange={(e) => setSolPerfil(e.target.value)}
                            required
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Selecione</option>
                            <option value="sindico">Síndico</option>
                            <option value="subsindico">Subsíndico</option>
                            <option value="administradora">Administradora</option>
                            <option value="morador">Morador responsável</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sol-mensagem">Mensagem</Label>
                          <textarea
                            id="sol-mensagem"
                            value={solMensagem}
                            onChange={(e) => setSolMensagem(e.target.value)}
                            placeholder="Conte um pouco sobre o condomínio ou sobre o interesse no Vaga Livre"
                            className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="hero"
                          className="w-full"
                          disabled={solicitando}
                        >
                          {solicitando ? 'Enviando...' : 'Enviar solicitação'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;