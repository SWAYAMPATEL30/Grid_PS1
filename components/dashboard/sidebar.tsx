'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3, Map, TrendingUp, Clock, Zap, Activity, Shield, MapPin,
  FileText, DollarSign, PieChart, Settings, Menu, X, Users, Gauge, Brain,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';

const ALL_NAV: { label: string; href: string; icon: any; group: string; roles?: string[] }[] = [
  { label: 'Overview',       href: '/dashboard/overview',    icon: BarChart3, group: 'Main' },
  { label: 'Heatmap',        href: '/dashboard/heatmap',     icon: Map,       group: 'Intelligence' },
  { label: 'Temporal',       href: '/dashboard/temporal',    icon: Clock,     group: 'Intelligence' },
  { label: 'Patterns',       href: '/dashboard/patterns',    icon: TrendingUp,group: 'Intelligence' },
  { label: 'Forecast',       href: '/dashboard/forecast',    icon: Zap,       group: 'Intelligence' },
  { label: 'ML Predictions', href: '/dashboard/ml',          icon: Brain,     group: 'Intelligence', roles: ['ADMIN', 'ANALYST'] },
  { label: 'Speed Analytics',href: '/dashboard/speed',       icon: Gauge,     group: 'Intelligence' },
  { label: 'Queue',          href: '/dashboard/queue',       icon: Activity,  group: 'Operations' },
  { label: 'Enforcement',    href: '/dashboard/enforcement', icon: Shield,    group: 'Operations' },
  { label: 'Zones',          href: '/dashboard/zones',       icon: MapPin,    group: 'Operations' },
  { label: 'SCITA',          href: '/dashboard/scita',       icon: FileText,  group: 'Operations', roles: ['ADMIN', 'ANALYST'] },
  { label: 'Compliance',     href: '/dashboard/compliance',  icon: FileText,  group: 'Compliance' },
  { label: 'Appeals',        href: '/dashboard/appeals',     icon: FileText,  group: 'Compliance' },
  { label: 'Reputation',     href: '/dashboard/reputation',  icon: Shield,    group: 'Compliance' },
  { label: 'Revenue',        href: '/dashboard/revenue',     icon: DollarSign,group: 'Admin', roles: ['ADMIN', 'ANALYST'] },
  { label: 'Analytics',      href: '/dashboard/analytics',   icon: PieChart,  group: 'Admin', roles: ['ADMIN', 'ANALYST'] },
  { label: 'User Management',href: '/dashboard/admin/users', icon: Users,     group: 'Admin', roles: ['ADMIN'] },
  { label: 'Live Map',       href: '/dashboard/admin/map',   icon: Map,       group: 'Admin', roles: ['ADMIN'] },
  { label: 'Settings',       href: '/dashboard/settings',    icon: Settings,  group: 'Admin', roles: ['ADMIN'] },
];

const groupOrder = ['Main', 'Intelligence', 'Operations', 'Compliance', 'Admin'];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const role = user?.role || 'ANALYST';
  const visibleNav = ALL_NAV.filter(item => !item.roles || item.roles.includes(role));
  const groupedItems = groupOrder
    .map(group => ({ group, items: visibleNav.filter(item => item.group === group) }))
    .filter(g => g.items.length > 0);

  const ROLE_COLOR: Record<string, string> = {
    ADMIN:          'text-red-600   dark:text-red-400   bg-red-50   dark:bg-red-900/20',
    ANALYST:        'text-blue-600  dark:text-blue-400  bg-blue-50  dark:bg-blue-900/20',
    VERIFIER:       'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    POLICE_OFFICER: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    TOW_OPERATOR:   'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    CITIZEN:        'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    VEHICLE_OWNER:  'text-cyan-600  dark:text-cyan-400  bg-cyan-50  dark:bg-cyan-900/20',
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="text-2xl">🚔</div>
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100">
            ParkSight<span className="text-blue-600 dark:text-blue-400"> AI</span>
          </h1>
          <p className="text-xs text-slate-500">v2.0 · Multi-Role Platform</p>
        </div>
      </div>

      {/* User Badge */}
      {user && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.full_name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${ROLE_COLOR[user.role] || 'text-slate-500'}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {groupedItems.map(({ group, items }) => (
          <div key={group}>
            <div className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              {group}
            </div>
            <div className="space-y-0.5">
              {items.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <div className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-600/30 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    )}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-400 dark:text-slate-600">
        ParkSight AI v2.0 © 2025
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-60 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 shadow-sm dark:shadow-none">
        {sidebarContent}
      </aside>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="fixed left-4 top-4 z-50 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md"
        >
          {open ? <X className="h-5 w-5 text-slate-600 dark:text-slate-300" /> : <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
        </button>
        {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full'
        )}>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
