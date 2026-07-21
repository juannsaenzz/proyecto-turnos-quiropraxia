'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/admin/turnos');
      }
    });

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
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
