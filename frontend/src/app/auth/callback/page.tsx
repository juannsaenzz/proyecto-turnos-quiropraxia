'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const supabase = createClient();
  const [debugLog, setDebugLog] = useState<string[]>(['Iniciando callback...']);

  const addLog = (msg: string) => setDebugLog(prev => [...prev, msg]);

  useEffect(() => {
    addLog('useEffect ejecutado. Esperando onAuthStateChange o getSession...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Evento de auth: ${event}`);
      if (event === 'SIGNED_IN' && session) {
        addLog('¡Sesión detectada en onAuthStateChange! Redirigiendo a /admin/turnos en 2s...');
        setTimeout(() => router.push('/admin/turnos'), 2000);
      } else if (event === 'SIGNED_OUT') {
        addLog('Evento SIGNED_OUT detectado. Usuario no autenticado.');
      }
    });

    const checkSession = async () => {
      try {
        addLog('Llamando a getSession()...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          addLog(`Error en getSession: ${error.message}`);
          return;
        }

        if (data.session) {
          addLog(`¡Sesión detectada en getSession! Email: ${data.session.user.email}`);
          addLog('Redirigiendo a /admin/turnos en 2s...');
          setTimeout(() => router.push('/admin/turnos'), 2000);
        } else {
          addLog('No se encontró sesión en getSession. El código PKCE pudo fallar o ya consumirse.');
        }
      } catch (err: any) {
        addLog(`Excepción en checkSession: ${err.message}`);
      }
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-500 font-medium animate-pulse mb-8">Completando inicio de sesión...</p>
      
      <div className="bg-black/50 p-6 rounded-xl border border-slate-800 w-full max-w-2xl text-left font-mono text-xs text-green-400 overflow-y-auto max-h-96">
        <h3 className="text-white mb-2 font-bold">Debug Log (Toma captura de esto):</h3>
        {debugLog.map((log, i) => (
          <div key={i} className="mb-1">{`> ${log}`}</div>
        ))}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
