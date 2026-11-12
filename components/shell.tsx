'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PanelLeftClose,
  Menu,
  X,
  RefreshCw,
  ChevronDown,
  CircleHelp,
  LogOut,
} from 'lucide-react';
import { nav } from '@/lib/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const page = nav.find((n) => n.href === path)?.label || 'Overview';
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const client = createBrowserSupabaseClient();
    await client.auth.signOut();
    window.location.assign('/login');
  }

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className={'app ' + (collapsed ? 'collapsed' : '')}>
      <div className={'overlay ' + (open ? 'show' : '')} onClick={() => setOpen(false)} />

      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <div className="sidebar-top">
          <Link href="/" className="brand">
            <span className="mark">N<span>75</span></span>
            <span className="brand-text">NewsTeen75<small>ADMIN WORKSPACE</small></span>
          </Link>

          <button className="icon-btn collapse" aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)}>
            <PanelLeftClose size={17} />
          </button>

          <button className="icon-btn mobile-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <div className="workspace-icon">N</div>
          <div className="brand-text">
            <strong>NewsTeen75</strong>
            <small>Admin workspace</small>
          </div>
          <ChevronDown size={14} className="brand-text" />
        </div>

        <nav>
          {nav.map((item, i) => (
            <div key={item.href}>
              {item.group && <div className="nav-group">{item.group}</div>}
              <Link
                title={item.label}
                onClick={() => setOpen(false)}
                className={'nav-link ' + (path === item.href ? 'active' : '')}
                href={item.href}
              >
                <item.icon size={18} strokeWidth={1.8} />
                <span className="brand-text">{item.label}</span>
                {i === 0 && <span className="active-dot" />}
              </Link>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help">
            <CircleHelp size={17} />
            <span className="brand-text">NewsTeen75 dashboard</span>
          </div>

          <div className="profile">
            <div className="avatar">N</div>
            <div className="profile-text brand-text">
              <strong>Administrator</strong>
              <small>Secure admin session</small>
            </div>
          </div>

          <button
            className="logout-btn"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={17} />
            <span className="brand-text">{loggingOut ? 'Signing out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="icon-btn menu" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{page}</strong>
          </div>

          <div className="top-actions">
            <span className="connection">
              <i /> Dashboard
              <span className="connection-label"> · auto-refresh 30s</span>
            </span>

            <button className="icon-btn refresh" title="Refresh" aria-label="Refresh" onClick={() => router.refresh()}>
              <RefreshCw size={17} />
            </button>

            <div className="top-avatar">N</div>
          </div>
        </header>

        <main className="main">{children}</main>
      </div>
    </div>
  );
}
