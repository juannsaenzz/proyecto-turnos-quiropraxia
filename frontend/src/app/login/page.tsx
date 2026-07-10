'use client';

import { createClient } from '@/utils/supabase/client';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error logging in with Google:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-emerald-900/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-3xl mb-6 shadow-xl shadow-slate-900/50">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">Panel Administrativo</h1>
          <p className="text-slate-400 font-medium">Ingresa para gestionar turnos y pacientes</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/30 border border-rose-900/30 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-300">
              Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.
            </p>
          </div>
        )}

        <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl backdrop-blur-xl">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs font-medium text-slate-500">
              Área restringida. Solo personal autorizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
