import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Supabase project provided by user: https://supabase.com/dashboard/project/brnhalxydcakutxiregp
export const SUPABASE_PROJECT_REF = 'brnhalxydcakutxiregp';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  title: string;
  avatar: string;
  isStaffOnly: boolean;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseInstance;
    }
  } catch (err) {
    console.warn('Supabase initialization notice:', err);
  }
  return null;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const supabase = getSupabaseClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
export async function signInStaff(email: string, password: string): Promise<StaffUser> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Authentication is not configured. Contact the site administrator.');
  const {data,error} = await supabase.auth.signInWithPassword({email:email.trim(),password});
  if(error || !data.user) throw new Error(error?.message || 'Sign-in failed.');
  const response = await apiFetch('/api/auth/session', {method:'POST'});
  const result = await response.json();
  if(!response.ok) { await supabase.auth.signOut(); throw new Error(result.error); }
  return result.user;
}

export async function signInStaffWithMicrosoft(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Authentication is not configured. Contact the site administrator.');
  const { error } = await supabase.auth.signInWithSSO({
    domain: 'q-ai.online',
    options: { redirectTo: new URL('/', window.location.origin).toString() }
  });
  if (error) throw error;
}
