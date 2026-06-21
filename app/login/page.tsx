'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN: '/dashboard/overview',
  ANALYST: '/dashboard/overview',
  VERIFIER: '/verify',
  POLICE_OFFICER: '/field',
  TOW_OPERATOR: '/tow',
  CITIZEN: '/citizen',
  VEHICLE_OWNER: '/owner',
};

const DEMO_CREDS = [
  { role: 'ADMIN', email: 'admin@parksight.in', color: 'from-red-500 to-rose-600', icon: '🛡️', label: 'Admin' },
  { role: 'ANALYST', email: 'analyst@parksight.in', color: 'from-blue-500 to-indigo-600', icon: '📊', label: 'Analyst' },
  { role: 'VERIFIER', email: 'verifier@parksight.in', color: 'from-purple-500 to-fuchsia-600', icon: '✅', label: 'Verifier' },
  { role: 'POLICE_OFFICER', email: 'officer.rao@parksight.in', color: 'from-green-500 to-emerald-600', icon: '👮', label: 'Officer' },
  { role: 'TOW_OPERATOR', email: 'tow.operator1@parksight.in', color: 'from-amber-500 to-orange-600', icon: '🚛', label: 'Tow Op' },
  { role: 'CITIZEN', email: 'citizen@example.com', color: 'from-slate-400 to-slate-500', icon: '👤', label: 'Citizen' },
  { role: 'VEHICLE_OWNER', email: 'owner@example.com', color: 'from-cyan-400 to-teal-500', icon: '🚗', label: 'Owner' },
];

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push(ROLE_REDIRECTS[user.role] || '/dashboard/overview');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 z-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
      />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 z-10">
        {/* Left: Branding */}
        <div className="flex flex-col justify-center gap-6 animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-both">
          <div className="flex items-center gap-3">
            <div className="text-5xl drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🚔</div>
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">ParkSight<span className="text-blue-500 ml-1 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">AI</span></h1>
              <p className="text-blue-400/80 font-medium text-sm mt-1 uppercase tracking-[0.2em]">Multi-Role Enforcement</p>
            </div>
          </div>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
            A unified intelligence platform connecting <span className="text-slate-200 font-medium">police officers</span>, <span className="text-slate-200 font-medium">analysts</span>, and <span className="text-slate-200 font-medium">citizens</span> in real-time.
          </p>

          {/* Demo Quick Login */}
          <div className="mt-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Quick Demo Access
              </p>
              <p className="text-xs text-slate-500 bg-black/40 px-2 py-1 rounded-md font-mono">Password@123</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {DEMO_CREDS.map(({ role, email: e, color, icon, label }, i) => (
                <button
                  key={role}
                  onClick={() => { setEmail(e); setPassword('Password@123'); }}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both text-left px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-xs group/btn relative overflow-hidden shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300`} />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base drop-shadow-md">{icon}</span>
                    <span className={`font-semibold text-slate-300 group-hover/btn:text-white transition-colors`}>{label}</span>
                  </div>
                  <div className="text-slate-500 truncate font-mono text-[10px] opacity-70 group-hover/btn:opacity-100 transition-opacity">{e}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex flex-col justify-center relative animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-both delay-200">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-purple-500/20 blur-[100px] -z-10" />
          
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
            
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm mb-10">Sign in to your role-based workspace</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@parksight.in"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm font-medium font-mono tracking-widest"
                  />
                </div>
              </div>

              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3 text-sm flex items-center gap-3 font-medium">
                  <span className="text-lg">⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl px-5 py-4 transition-all duration-300 flex items-center justify-center gap-3 text-sm shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </>
                ) : 'Access Dashboard →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
