import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const normalizarEmail = (email: string) => email.trim().toLowerCase();

  const emailValido = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

      const { error: signUpError } = await signUp(
        emailNormalizado,
        regPassword,
        { nome: regNome.trim() }
      );

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
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;