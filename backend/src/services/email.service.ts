import { env } from '../config/env';
import { logger } from '../config/logger';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /**
   * Verification/password-reset/invite emails stay direct fire-and-forget
   * (register/forgot-password/invite must never block or fail on a slow or
   * failing provider), so those keep the default of swallowing the error.
   * The three emails queued through email.processor.ts (Phase 7) set this
   * so a real send failure throws instead — that's what lets BullMQ's
   * attempts/backoff (jobs/queues.ts) actually retry them.
   */
  throwOnFailure?: boolean;
}

/**
 * With no EMAIL_API_KEY configured (local dev/this sandbox), emails are
 * logged instead of sent so the flow is testable without a real provider.
 */
async function send({ to, subject, html, throwOnFailure = false }: SendEmailInput): Promise<void> {
  if (!env.EMAIL_API_KEY) {
    logger.info({ to, subject, html }, 'EMAIL_API_KEY not set — logging email instead of sending');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      throw new Error(`Email provider responded ${res.status}`);
    }
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    if (throwOnFailure) throw err;
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

function newMessageEmailHtml(senderName: string, threadUrl: string): string {
  return `<p>${senderName} sent you a new message on AI Coach OS:</p><p><a href="${threadUrl}">${threadUrl}</a></p>`;
}

function atRiskAlertEmailHtml(clientFullName: string, clientUrl: string): string {
  return `<p>AI Coach OS flagged <strong>${clientFullName}</strong> as at risk based on their recent check-ins.</p><p><a href="${clientUrl}">${clientUrl}</a></p>`;
}

function paymentReceiptEmailHtml(planLabel: string, amountInPaise: number, currency: string): string {
  const amount = (amountInPaise / 100).toFixed(2);
  return `<p>Thanks for your payment — you're now on the <strong>${planLabel}</strong> plan.</p><p>Amount charged: ${currency} ${amount}</p>`;
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

  // These three are called only from email.processor.ts (Phase 7's email
  // queue), never directly fire-and-forget — throwOnFailure lets a real
  // send failure surface to BullMQ so the job actually retries.
  sendNewMessageEmail(to: string, senderName: string, threadUrl: string) {
    return send({ to, subject: `${senderName} sent you a message — AI Coach OS`, html: newMessageEmailHtml(senderName, threadUrl), throwOnFailure: true });
  },

  sendAtRiskAlertEmail(to: string, clientFullName: string, clientUrl: string) {
    return send({
      to,
      subject: `${clientFullName} may need attention — AI Coach OS`,
      html: atRiskAlertEmailHtml(clientFullName, clientUrl),
      throwOnFailure: true,
    });
  },

  sendPaymentReceiptEmail(to: string, planLabel: string, amountInPaise: number, currency: string) {
    return send({
      to,
      subject: `Payment receipt — ${planLabel} plan — AI Coach OS`,
      html: paymentReceiptEmailHtml(planLabel, amountInPaise, currency),
      throwOnFailure: true,
    });
  },
};
