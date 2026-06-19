'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated } = useUser();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard/overview');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-4xl">🅿️</div>
        <p className="text-slate-400">Loading ParkSight AI...</p>
      </div>
    </div>
  );
}
