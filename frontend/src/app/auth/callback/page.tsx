'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import SpineLoadingIcon from '@/app/admin/components/SpineLoadingIcon';

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
      <SpineLoadingIcon className="h-16 w-16 text-emerald-500 animate-bounce mb-8" />
      <div className="text-center"></div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <SpineLoadingIcon className="h-16 w-16 text-emerald-500 animate-bounce" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
