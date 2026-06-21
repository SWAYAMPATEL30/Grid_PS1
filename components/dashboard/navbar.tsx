'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  ADMIN:          { label: 'Administrator', icon: '🛡️', color: 'text-red-400' },
  ANALYST:        { label: 'Data Analyst',  icon: '📊', color: 'text-blue-400' },
  VERIFIER:       { label: 'Verifier',      icon: '✅', color: 'text-purple-400' },
  POLICE_OFFICER: { label: 'Police Officer',icon: '👮', color: 'text-green-400' },
  TOW_OPERATOR:   { label: 'Tow Operator',  icon: '🚛', color: 'text-amber-400' },
  CITIZEN:        { label: 'Citizen',       icon: '👤', color: 'text-slate-300' },
  VEHICLE_OWNER:  { label: 'Vehicle Owner', icon: '🚗', color: 'text-cyan-400' },
};

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const roleInfo = ROLE_LABELS[user?.role || ''] || { label: user?.role, icon: '👤', color: 'text-slate-400' };
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0 z-30 sticky top-0 transition-colors duration-300">
      <div className="md:hidden w-8" />

      <div className="flex-1 flex items-center gap-3">
        <span className="hidden md:block text-sm font-semibold text-slate-700 dark:text-slate-300">ParkSight AI</span>
        <span className="hidden md:block text-slate-300 dark:text-slate-700">·</span>
        <span className="text-sm text-slate-500">Traffic Enforcement Platform</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          <div className="relative w-4 h-4">
            <Sun
              className={`absolute inset-0 h-4 w-4 text-amber-500 transition-all duration-300 ${
                isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <Moon
              className={`absolute inset-0 h-4 w-4 text-blue-400 transition-all duration-300 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              }`}
            />
          </div>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user.full_name?.[0] || '?'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user.full_name}</p>
                <p className={`text-xs leading-tight ${roleInfo.color}`}>{roleInfo.icon} {roleInfo.label}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className={`text-xs font-medium mt-1 inline-block ${roleInfo.color}`}>{roleInfo.icon} {roleInfo.label}</span>
                  </div>
                  {user.police_station && (
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Station</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{user.police_station}</p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
