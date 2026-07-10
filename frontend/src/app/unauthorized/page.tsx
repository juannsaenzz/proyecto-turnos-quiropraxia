'use client';

import { createClient } from '@/utils/supabase/client';
import { ShieldX, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-rose-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-[2rem] mb-6 shadow-2xl shadow-rose-900/20">
          <ShieldX className="h-16 w-16 text-rose-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-4">
          Acceso Denegado
        </h1>
        
        <p className="text-slate-400 font-medium mb-8 text-lg">
          No tienes los permisos necesarios para acceder al panel de administración.
        </p>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98] border border-slate-700"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión e intentar con otro correo
        </button>
      </div>
    </div>
  );
}
