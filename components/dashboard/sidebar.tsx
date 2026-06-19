'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Map,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  Shield,
  MapPin,
  FileText,
  DollarSign,
  PieChart,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/overview',
    icon: BarChart3,
    group: 'Main'
  },
  {
    label: 'Heatmap',
    href: '/dashboard/heatmap',
    icon: Map,
    group: 'Intelligence'
  },
  {
    label: 'Patterns',
    href: '/dashboard/patterns',
    icon: TrendingUp,
    group: 'Intelligence'
  },
  {
    label: 'Forecast',
    href: '/dashboard/forecast',
    icon: Zap,
    group: 'Intelligence'
  },
  {
    label: 'Temporal',
    href: '/dashboard/temporal',
    icon: Clock,
    group: 'Intelligence'
  },
  {
    label: 'Predictive AI',
    href: '/dashboard/predictive',
    icon: TrendingUp,
    group: 'Intelligence'
  },
  {
    label: 'Reputation',
    href: '/dashboard/reputation',
    icon: Shield,
    group: 'Intelligence'
  },
  {
    label: 'Queue',
    href: '/dashboard/queue',
    icon: Activity,
    group: 'Operations'
  },
  {
    label: 'Enforcement',
    href: '/dashboard/enforcement',
    icon: Shield,
    group: 'Operations'
  },
  {
    label: 'Zones',
    href: '/dashboard/zones',
    icon: MapPin,
    group: 'Operations'
  },
  {
    label: 'Compliance',
    href: '/dashboard/compliance',
    icon: FileText,
    group: 'Compliance'
  },
  {
    label: 'Appeals',
    href: '/dashboard/appeals',
    icon: FileText,
    group: 'Compliance'
  },
  {
    label: 'Revenue',
    href: '/dashboard/revenue',
    icon: DollarSign,
    group: 'Admin'
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: PieChart,
    group: 'Admin'
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    group: 'Admin'
  }
];

const groupOrder = ['Main', 'Intelligence', 'Operations', 'Compliance', 'Admin'];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groupedItems = groupOrder.map(group => ({
    group,
    items: navItems.filter(item => item.group === group)
  })).filter(g => g.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-6 border-b border-slate-800">
        <div className="text-2xl">🅿️</div>
        <div>
          <h1 className="text-lg font-bold text-slate-100">ParkSight</h1>
          <p className="text-xs text-slate-400">AI</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {groupedItems.map(({ group, items }) => (
          <div key={group}>
            <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {group}
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800",
                        isActive && "bg-slate-800 text-blue-400 hover:text-blue-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
        <p>v1.0.0</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="fixed left-4 top-4 z-50"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
        )}

        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-950 transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
