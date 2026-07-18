'use client';

import { createClient } from '@/utils/supabase/client';
import { ShieldX, LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/assets/1.png';
import React, { useState } from 'react';

export default function UnauthorizedPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
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
        <div className="inline-flex items-center justify-center bg-slate-900 border border-slate-800 rounded-3xl mb-6 shadow-2xl shadow-rose-900/20 overflow-hidden w-24 h-24">
          <Image src={logo} alt="Logo" width={96} height={96} className="object-cover w-full h-full" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-4">
          UPS
        </h1>
        
        <p className="text-slate-400 font-medium mb-8 text-lg">
          No perteneces a Centro Quiropráctico Nicolás
        </p>

        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98] border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          {isLoggingOut ? 'Cerrando sesión...' : 'Intentar con otra cuenta'}
        </button>
      </div>
    </div>
  );
}
