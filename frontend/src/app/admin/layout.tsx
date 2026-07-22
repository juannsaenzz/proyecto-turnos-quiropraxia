"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, FileText, Menu, X, Check, LogOut, Instagram, Facebook, MessageCircle, MapPin, Mail, Phone, RefreshCw } from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/SidebarContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo1 from '@/assets/1.png';
import vexaLogo from '@/assets/vexa-logo.png';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = React.useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
        setUserName(fullName.split(' ')[0]);
      }
    });
  }, []);

  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { id: 'turnos', label: 'Calendario de Turnos', icon: Calendar, path: '/admin/turnos' },
    { id: 'pacientes', label: 'Pacientes', icon: Users, path: '/admin/pacientes' },
  ];

  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between
        transition-transform duration-300 transform
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Header */}
          <div className="h-20 px-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <span className="font-extrabold text-slate-100 block leading-tight text-xl tracking-tight">Hola, {userName || 'Doc'}</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    w-full flex items-center space-x-3.5 px-5 py-3 rounded-2xl text-sm font-bold transition duration-150
                    ${isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3.5 px-5 py-3 rounded-2xl text-sm font-bold transition duration-150 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Page Content */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="flex flex-col w-full min-h-[100dvh] shrink-0">
            {children}
          </div>

          {/* Compact Footer */}
          <footer className="w-full bg-slate-900 border-t-2 border-t-emerald-500 shrink-0 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                {/* Brand & Description */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-950 rounded-lg border border-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden w-8 h-8">
                      <Image src={logo1} alt="Logo" width={32} height={32} className="object-cover w-full h-full" />
                    </div>
                    <span className="font-extrabold text-slate-100 text-base tracking-tight">Centro Quiropráctico Nicolás</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="text-center sm:text-right">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3 pb-2 border-b border-slate-800/50">
                    Navegación
                  </h3>
                  <ul className="space-y-2 flex flex-col sm:items-end">
                    <li><Link href="/admin/turnos" className="text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors">Calendario de Turnos</Link></li>
                    <li><Link href="/admin/pacientes" className="text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors">Pacientes</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800/80 bg-slate-950/30">
              <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
                <p>Copyright &copy; {new Date().getFullYear()} Centro Quiropráctico Nicolás. Todos los derechos reservados.</p>
                <div className="flex items-center gap-2 uppercase tracking-wider text-[10px]">
                  Desarrollado por <a href="https://www.instagram.com/vexa.systems/" target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity inline-flex"><Image src={vexaLogo} alt="Vexa Logo" width={80} height={30} className="h-7 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" /></a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

import { GlobalDataProvider } from './components/GlobalDataContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <GlobalDataProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </GlobalDataProvider>
    </SidebarProvider>
  );
}
