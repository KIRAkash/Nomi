// Who is signed in and in which role. Until Supabase phone OTP lands, the demo sign-in sets this and the web build keeps it across reloads.
import type { Role } from '@nomi/shared';
import type { Href } from 'expo-router';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const ROLE_TABS: Record<Role, readonly string[]> = {
  head_chef: ['dishes', 'pass', 'feedback', 'kitchen'],
  owner: ['today', 'dishes', 'feedback', 'insights'],
  manager: ['today', 'feedback', 'larder', 'team'],
  staff: ['check', 'cards', 'handover'],
};

export const ROLE_LABEL: Record<Role, string> = { head_chef: 'Head Chef', owner: 'Owner', manager: 'Manager', staff: 'Kitchen staff' };
export const ROLE_PERSON: Record<Role, { name: string; initials: string }> = {
  head_chef: { name: 'Chef Imran', initials: 'IK' },
  owner: { name: 'Priya', initials: 'PS' },
  manager: { name: 'Arjun', initials: 'AR' },
  staff: { name: 'Ravi', initials: 'RV' },
};

const KEY = 'nomi.role';
const read = (): Role | null => {
  try {
    const v = globalThis.localStorage?.getItem(KEY);
    return v && v in ROLE_TABS ? (v as Role) : null;
  } catch {
    return null;
  }
};
const write = (r: Role) => {
  try {
    globalThis.localStorage?.setItem(KEY, r);
  } catch {}
};

const CAM = 'nomi.democam';
const readCam = () => {
  try {
    return globalThis.localStorage?.getItem(CAM) === '1';
  } catch {
    return false;
  }
};

/** demoCamera: the camera plays the generated demo photos (docs/demo-images.md) instead of the device camera, for mock runs. */
type Session = { role: Role; signedIn: boolean; setRole: (r: Role) => void; home: () => Href; demoCamera: boolean; setDemoCamera: (on: boolean) => void };
const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, set] = useState<Role | null>(read);
  const [demoCamera, setCam] = useState(readCam);
  const value = useMemo<Session>(() => ({
    role: role ?? 'head_chef',
    signedIn: role !== null,
    setRole: (r) => { write(r); set(r); },
    home: () => `/${ROLE_TABS[role ?? 'head_chef'][0]}` as Href,
    demoCamera,
    setDemoCamera: (on) => {
      try {
        globalThis.localStorage?.setItem(CAM, on ? '1' : '0');
      } catch {}
      setCam(on);
    },
  }), [role, demoCamera]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}

/** True when the signed-in role may do this (spec section 2 permissions). */
export function can(role: Role, what: 'approve_reply' | 'edit_menu' | 'approve_action' | 'edit_stock' | 'manage_team') {
  switch (what) {
    case 'approve_reply':
    case 'approve_action':
    case 'manage_team':
      return role === 'owner' || role === 'manager';
    case 'edit_menu':
      return role === 'head_chef';
    case 'edit_stock':
      return role === 'manager';
  }
}
