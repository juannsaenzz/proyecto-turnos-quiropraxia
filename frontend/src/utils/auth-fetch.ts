import { createClient } from './supabase/client';

export async function authFetch(url: string | Request | URL, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers || {});
  console.log("Token en authFetch:", session?.access_token ? "EXISTE" : "NO EXISTE");
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
