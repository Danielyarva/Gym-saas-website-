'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { authService } from '@/services/auth.service';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@/schemas/auth.schema';
import { ApiError } from '@/services/api-client';
import { ShieldAlert } from 'lucide-react';

function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema) });

  const resetPassword = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => authService.resetPassword(token!, values.newPassword),
    onSuccess: () => setDone(true),
  });

  if (!token) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Invalid reset link"
        description="This password reset link is missing its token. Request a new one."
        action={
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Request a new link
          </Link>
        }
      />
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Password reset</h1>
        <p className="text-sm text-muted-foreground">You can now log in with your new password.</p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
      </div>

      <form onSubmit={handleSubmit((values) => resetPassword.mutate(values))} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
          {errors.newPassword ? <p className="text-xs text-destructive">{errors.newPassword.message}</p> : null}
        </div>

        {resetPassword.isError ? (
          <p className="text-xs text-destructive">
            {resetPassword.error instanceof ApiError ? resetPassword.error.message : 'Something went wrong'}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
