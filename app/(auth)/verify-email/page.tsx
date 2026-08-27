'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/services/api-client';

function verifiedLocallyKey(token: string) {
  return `email-verified:${token}`;
}

/** A verification token is single-use: the backend rejects a second attempt
 * with the same "invalid or expired" error as a genuinely bad token. Without
 * this, reloading this page (or opening the link twice) after a successful
 * verification would re-fire the request and incorrectly show "Verification
 * failed" even though the email was verified the first time. */
function wasVerifiedLocally(token: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(verifiedLocallyKey(token)) === '1';
  } catch {
    return false;
  }
}

function markVerifiedLocally(token: string): void {
  try {
    window.localStorage.setItem(verifiedLocallyKey(token), '1');
  } catch {
    // Best-effort only — worst case a reload re-hits the backend, which still answers correctly for a first-time token.
  }
}

function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const alreadyVerified = Boolean(token) && wasVerifiedLocally(token!);

  const { isPending, isError, error } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      await authService.verifyEmail(token!);
      markVerifiedLocally(token!);
      return null;
    },
    enabled: Boolean(token) && !alreadyVerified,
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

  if (isPending && !alreadyVerified) {
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
