'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/services/api-client';

function VerifyEmailContent() {
  const token = useSearchParams().get('token');

  const { isPending, isError, error } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authService.verifyEmail(token!),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-warning" />
        <h1 className="text-lg font-semibold text-foreground">Invalid verification link</h1>
        <p className="text-sm text-muted-foreground">This link is missing its token.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">Verification failed</h1>
        <p className="text-sm text-muted-foreground">{error instanceof ApiError ? error.message : 'This link is invalid or has expired.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <CheckCircle2 className="h-8 w-8 text-success" />
      <h1 className="text-lg font-semibold text-foreground">Email verified</h1>
      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
