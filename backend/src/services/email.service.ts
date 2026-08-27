import { env } from '../config/env';
import { logger } from '../config/logger';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Phase 1 has no job queue (BullMQ is Phase 7), so sends are fire-and-forget:
 * a slow or failing email provider must never block or fail the HTTP
 * response for register/forgot-password. Failures are logged, not thrown.
 * With no EMAIL_API_KEY configured (local dev), emails are logged instead
 * of sent so the flow is testable without a real provider.
 */
async function send({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!env.EMAIL_API_KEY) {
    logger.info({ to, subject, html }, 'EMAIL_API_KEY not set — logging email instead of sending');
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

function verificationEmailHtml(verifyUrl: string): string {
  return `<p>Welcome to AI Coach OS. Verify your email address to finish setting up your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
}

function passwordResetEmailHtml(resetUrl: string): string {
  return `<p>We received a request to reset your AI Coach OS password. This link expires in ${env.PASSWORD_RESET_TTL_HOURS} hour(s):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
}

function clientInviteEmailHtml(coachFullName: string, inviteUrl: string): string {
  return `<p>${coachFullName} has invited you to AI Coach OS to track your training, nutrition, and progress together.</p><p>Set up your account to get started:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This link expires in ${env.CLIENT_INVITE_TTL_HOURS} hours.</p>`;
}

export const emailService = {
  sendVerificationEmail(to: string, rawToken: string) {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    return send({ to, subject: 'Verify your email — AI Coach OS', html: verificationEmailHtml(verifyUrl) });
  },

  sendPasswordResetEmail(to: string, rawToken: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    return send({ to, subject: 'Reset your password — AI Coach OS', html: passwordResetEmailHtml(resetUrl) });
  },

  sendClientInviteEmail(to: string, coachFullName: string, rawToken: string) {
    const inviteUrl = `${env.FRONTEND_URL}/invite?token=${rawToken}`;
    return send({ to, subject: `${coachFullName} invited you to AI Coach OS`, html: clientInviteEmailHtml(coachFullName, inviteUrl) });
  },
};
