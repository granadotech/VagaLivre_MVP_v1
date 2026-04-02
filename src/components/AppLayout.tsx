import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ParkingSquare, Clock, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

  const BottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const isActive = (path: string) => location.pathname === path;


  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/buscar', icon: Search, label: 'Buscar' },
    { path: '/minhas-vagas', icon: ParkingSquare, label: 'Minhas Vagas' },
    { path: '/historico', icon: Clock, label: 'Minhas Reservas' },
    ...(profile?.role === 'admin'
      ? [{ path: '/admin', icon: Settings, label: 'Admin' }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
              isActive(path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

const TopBar = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Vaga Livre" width={28} height={28} />
          <span className="font-heading font-bold text-foreground">Vaga Livre</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{profile?.nome}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="max-w-lg mx-auto pt-16 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
