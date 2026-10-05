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

// Authorized Staff Directory (Users allowed in Supabase Auth policy)
export const AUTHORIZED_STAFF_ACCOUNTS: StaffUser[] = [
  {
    id: 'staff-scott-qai',
    email: 'scott@q-ai.online',
    name: 'Scott Harvey-Whittle',
    role: 'admin',
    title: 'Lead Approver & Communications Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isStaffOnly: true
  },
  {
    id: 'staff-scott-ou',
    email: 'scott.harveywhittle@ou.ac.uk',
    name: 'Scott Harvey-Whittle',
    role: 'admin',
    title: 'Lead Approver & Open University Communications Fellow',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isStaffOnly: true
  }
];

// Explicit list of accounts revoked/unauthorized in Supabase Auth
export const UNAUTHORIZED_ACCOUNTS: Array<{ name: string; email: string; formerRole: string; reason: string }> = [
  {
    name: 'Jordan Vance',
    email: 'jordan.vance@qintelligence.org',
    formerRole: 'Former Editorial Reviewer',
    reason: 'Account revoked in Supabase Auth RLS policies. Unauthorized to access the platform.'
  },
  {
    name: 'Morgan Blake',
    email: 'morgan.blake@qintelligence.org',
    formerRole: 'Former Community Safety Officer',
    reason: 'Account revoked in Supabase Auth RLS policies. Unauthorized to access the platform.'
  }
];

export function verifySupabaseStaffAccess(email: string): {
  authorized: boolean;
  user?: StaffUser;
  error?: string;
  isExplicitlyRevoked?: boolean;
} {
  const normalized = email.trim().toLowerCase();

  const matched = AUTHORIZED_STAFF_ACCOUNTS.find(user => user.email.toLowerCase() === normalized);
  return matched ? { authorized: true, user: { ...matched, role: normalized === 'scott@q-ai.online' ? 'admin' : 'staff' } } : { authorized: false, error: 'This account is not authorised for this workspace.' };
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
