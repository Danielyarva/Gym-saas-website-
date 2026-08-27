'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { useAcceptInvite, useInvitePreview } from '@/hooks/use-auth';
import { acceptInviteFormSchema, type AcceptInviteFormValues } from '@/schemas/auth.schema';
import { ApiError } from '@/services/api-client';

function InviteContent() {
  const token = useSearchParams().get('token');
  const router = useRouter();
  const preview = useInvitePreview(token ?? '');
  const acceptInvite = useAcceptInvite();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteFormSchema) });

  if (!token) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Invalid invite link"
        description="This link is missing its token. Ask your coach to resend the invite."
      />
    );
  }

  if (preview.isPending) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking your invite…</p>
      </div>
    );
  }

  if (preview.isError) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="This invite isn't valid"
        description={preview.error instanceof ApiError ? preview.error.message : 'It may have expired or already been used.'}
      />
    );
  }

  const onSubmit = (values: AcceptInviteFormValues) => {
    acceptInvite.mutate(
      { token, password: values.password },
      {
        onSuccess: () => {
          toast.success(`Welcome, ${preview.data.clientFullName.split(' ')[0]}!`);
          router.replace('/onboarding');
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {preview.data.clientFullName}</h1>
        <p className="text-sm text-muted-foreground">Set a password for {preview.data.email} to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">At least 10 characters, with an uppercase letter, lowercase letter, and number.</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={acceptInvite.isPending}>
          {acceptInvite.isPending ? 'Setting up your account…' : 'Get started'}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Already set up your account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
