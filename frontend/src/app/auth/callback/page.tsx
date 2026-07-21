'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // The Supabase client automatically handles the OAuth callback from the URL.
    // It exchanges the code for a session and sets the cookies via the browser.
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Once signed in, redirect to the admin panel
        router.push('/admin/turnos');
      }
    });

    // Fallback: check manually in case the event already fired before we subscribed
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin/turnos');
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
      <p className="text-emerald-500 font-medium animate-pulse">Completando inicio de sesión...</p>
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
