'use client';

import { useUser } from '@/context/user-context';
import { useMode } from '@/context/mode-context';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Bell, LogOut, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, logout } = useUser();
  const { mode, toggleMode } = useMode();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="hidden md:flex md:flex-1">
          <h2 className="text-lg font-semibold text-slate-100">
            {mode === 'police' ? '🚔 Police Mode' : '📦 Logistics Mode'}
          </h2>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMode}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            <Zap className="h-4 w-4 mr-2" />
            <span className="text-xs uppercase">{mode === 'police' ? '→ Logistics' : '→ Police'}</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 text-slate-300 hover:text-slate-100 hover:bg-slate-800" })}
            >
              <div className="text-xl">{user?.avatar || '👤'}</div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
              <DropdownMenuLabel className="text-slate-100">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="text-slate-300 hover:text-slate-100 cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:text-slate-100 cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 cursor-pointer flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
