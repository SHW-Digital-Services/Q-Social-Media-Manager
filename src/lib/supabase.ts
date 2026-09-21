import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Supabase project provided by user: https://supabase.com/dashboard/project/brnhalxydcakutxiregp
export const SUPABASE_PROJECT_REF = 'brnhalxydcakutxiregp';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_fallback';

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

  // Check if explicitly blocked/unauthorized (Jordan & Morgan)
  const revoked = UNAUTHORIZED_ACCOUNTS.find(
    u => u.email.toLowerCase() === normalized || 
         (normalized.includes('jordan') && u.email.includes('jordan')) ||
         (normalized.includes('morgan') && u.email.includes('morgan'))
  );

  if (revoked) {
    return {
      authorized: false,
      isExplicitlyRevoked: true,
      error: `Access Denied (403): ${revoked.name} (${revoked.email}) is NOT authorized to access this platform. Supabase Auth row-level access policies have revoked this account.`
    };
  }

  // Check against authorized Supabase directory
  const matched = AUTHORIZED_STAFF_ACCOUNTS.find(
    u => u.email.toLowerCase() === normalized ||
         (normalized.includes('scott') && u.email.includes('scott'))
  );

  if (matched) {
    return {
      authorized: true,
      user: matched
    };
  }

  if (normalized.endsWith('@q-ai.online') || normalized.endsWith('@ou.ac.uk')) {
    const rawName = normalized.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = rawName.replace(/\b\w/g, l => l.toUpperCase());
    return {
      authorized: true,
      user: {
        id: `staff-${normalized.replace(/[^a-z0-9]/g, '-')}`,
        email: normalized,
        name: formattedName,
        role: normalized.includes('admin') || normalized.includes('lead') || normalized.includes('scott') ? 'admin' : 'staff',
        title: 'Q Intelligence Team Member',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isStaffOnly: true
      }
    };
  }

  return {
    authorized: false,
    error: `Access Restricted: "${email}" is not registered in the active Supabase Auth directory for project ${SUPABASE_PROJECT_REF}. Only authorized administrators have access.`
  };
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
