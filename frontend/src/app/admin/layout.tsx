"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, FileText, Menu, X, Check, LogOut } from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/SidebarContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo3 from '@/assets/3.png';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = React.useState<string>('');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
        setUserName(fullName.split(' ')[0]);
      }
    });
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { id: 'turnos', label: 'Calendario de Turnos', icon: Calendar, path: '/admin/turnos' },
    { id: 'pacientes', label: 'Pacientes', icon: Users, path: '/admin/pacientes' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
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
              <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex-shrink-0 flex items-center justify-center">
                <Image src={logo3} alt="Logo" width={36} height={36} className="object-cover rounded-full" />
              </div>
              <div>
                <span className="font-extrabold text-slate-100 block leading-tight text-base tracking-tight">Hola, {userName || 'Doc'}</span>
                <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">Consultorio</span>
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
                    w-full flex items-center space-x-3.5 px-4.5 py-3.5 rounded-2xl text-sm font-bold transition duration-150
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
            className="w-full flex items-center space-x-3.5 px-4.5 py-3.5 rounded-2xl text-sm font-bold transition duration-150 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
