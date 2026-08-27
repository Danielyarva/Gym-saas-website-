'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@/schemas/auth.schema';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema) });

  const forgotPassword = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) => authService.forgotPassword(values.email),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground">If an account exists for that email, we&apos;ve sent a link to reset your password.</p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit((values) => forgotPassword.mutate(values))} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
