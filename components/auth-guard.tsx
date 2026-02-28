'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { PageLoader } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(() => setChecking(false))
      .catch(() => router.replace('/login'));
  }, [router]);

  if (checking) return <PageLoader />;
  return <>{children}</>;
}
