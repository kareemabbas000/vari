'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Logo from '@/components/Logo';
import { supabaseBrowser } from '@/lib/supabase/browser';
import type { AppRole } from '@/lib/supabase/server';
import { Badge } from './ui';

const RANK: Record<AppRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

type Item = { href: string; label: string; min: AppRole; icon: string };
const NAV: { group: string; items: Item[] }[] = [
  { group: 'Overview', items: [{ href: '/admin', label: 'Dashboard', min: 'viewer', icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' }] },
  {
    group: 'Inbox',
    items: [
      { href: '/admin/enquiries', label: 'Enquiries', min: 'viewer', icon: 'M3 6h18v12H3zM3 7l9 7 9-7' },
      { href: '/admin/subscribers', label: 'Subscribers', min: 'viewer', icon: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c1-4 4-6 8-6s7 2 8 6' },
    ],
  },
  {
    group: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects', min: 'viewer', icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z' },
      { href: '/admin/categories', label: 'Categories', min: 'viewer', icon: 'M4 6h16M4 12h10M4 18h6' },
      { href: '/admin/services', label: 'Services', min: 'viewer', icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5' },
      { href: '/admin/blog', label: 'Blog', min: 'viewer', icon: 'M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5' },
      { href: '/admin/pages', label: 'Pages & builder', min: 'viewer', icon: 'M4 3h11l5 5v13H4zM15 3v5h5M8 13h8M8 17h5' },
      { href: '/admin/home', label: 'Home & intro', min: 'viewer', icon: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h10v2H4z' },
      { href: '/admin/texts', label: 'Texts & translations', min: 'viewer', icon: 'M4 5h10M9 5v14M14 13h6M17 13v6M15 19h4' },
      { href: '/admin/media', label: 'Media library', min: 'viewer', icon: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9a1 1 0 100-2 1 1 0 000 2' },
    ],
  },
  {
    group: 'Site',
    items: [
      { href: '/admin/menus', label: 'Menus & announcement', min: 'admin', icon: 'M4 6h16M4 12h16M4 18h10' },
      { href: '/admin/tracking', label: 'Analytics & tracking', min: 'admin', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
      { href: '/admin/settings', label: 'Brand & settings', min: 'admin', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-2-4-2 1-2-2V4h-4v2l-2 2-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 2v2h4v-2l2-2 2 1 2-4-2-1z' },
    ],
  },
  {
    group: 'Team',
    items: [
      { href: '/admin/team', label: 'Members & roles', min: 'admin', icon: 'M9 11a3 3 0 100-6 3 3 0 000 6zM17 11a3 3 0 100-6M3 20c.7-3 3-5 6-5s5.3 2 6 5M15 15c3 0 5.3 2 6 5' },
      { href: '/admin/activity', label: 'Activity log', min: 'admin', icon: 'M12 7v5l3 3M12 21a9 9 0 110-18 9 9 0 010 18z' },
    ],
  },
];

const ROLE_TONE: Record<AppRole, 'gold' | 'blue' | 'green' | 'grey'> = { owner: 'gold', admin: 'blue', editor: 'green', viewer: 'grey' };

export type Member = { email: string; name: string | null; role: AppRole };

const MemberContext = createContext<Member | null>(null);
/** The signed-in team member (for showing/hiding actions; RLS enforces the same rules). */
export function useMember() {
  const m = useContext(MemberContext);
  if (!m) throw new Error('useMember outside the panel');
  return { ...m, can: (min: AppRole) => RANK[m.role] >= RANK[min] };
}

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={d} />
    </svg>
  );
}

export default function AdminShell({ member, newEnquiries, children }: { member: Member; newEnquiries: number; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const allowed = NAV.map((g) => ({ ...g, items: g.items.filter((i) => RANK[member.role] >= RANK[i.min]) })).filter((g) => g.items.length);
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav aria-label="Control panel" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {allowed.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 font-sans text-[0.65rem] uppercase tracking-[0.22em] text-bone/35">{g.group}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={isActive(i.href) ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-sm px-3 text-[0.92rem] transition-colors ${
                    isActive(i.href) ? 'bg-gold/10 text-gold' : 'text-bone/70 hover:bg-bone/5 hover:text-bone'
                  }`}
                >
                  <Icon d={i.icon} />
                  <span className="flex-1">{i.label}</span>
                  {i.href === '/admin/enquiries' && newEnquiries > 0 && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[0.7rem] font-semibold text-night">{newEnquiries}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-bone/10 p-4">
      <Link href="/admin/account" className="block rounded-sm p-2 hover:bg-bone/5">
        <p className="truncate text-sm text-bone">{member.name || member.email}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
          {member.name && <span className="truncate text-xs text-bone/40">{member.email}</span>}
        </div>
      </Link>
      <div className="mt-2 flex items-center justify-between px-2 text-sm">
        <a href="/" target="_blank" rel="noreferrer" className="text-bone/50 hover:text-gold">
          View website ↗
        </a>
        <button type="button" onClick={signOut} className="text-bone/50 hover:text-[#E8A598]">
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <MemberContext.Provider value={member}>
    <div className="min-h-[100svh] lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-bone/10 bg-[#100f0e] lg:flex">
        <Link href="/admin" className="flex items-center gap-3 border-b border-bone/10 px-6 py-5">
          <Logo className="h-auto w-[78px]" sizes="78px" />
          <span className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-bone/40">Panel</span>
        </Link>
        {nav}
        {account}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-bone/10 bg-night/90 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo className="h-auto w-[64px]" sizes="64px" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="relative flex h-11 w-11 items-center justify-center rounded-sm text-bone hover:bg-bone/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          {newEnquiries > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />}
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-night/70 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex w-[min(86vw,320px)] flex-col border-l border-bone/10 bg-[#100f0e] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-bone/10 px-4">
            <span className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-bone/40">Menu</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-sm hover:bg-bone/5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {nav}
          {account}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">{children}</main>
    </div>
    </MemberContext.Provider>
  );
}
