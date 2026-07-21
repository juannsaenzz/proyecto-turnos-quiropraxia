'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <RefreshCw className="h-12 w-12 animate-spin text-emerald-500 mb-8" />
      <div className="text-center"></div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="h-12 w-12 animate-spin text-emerald-500" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
