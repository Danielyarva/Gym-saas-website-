import type { Job } from 'bullmq';
import { emailService } from '../../services/email.service';
import type { AtRiskAlertEmailJob, EmailJobData, NewMessageEmailJob, PaymentReceiptEmailJob } from '../queues';

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  switch (job.name) {
    case 'at-risk-alert': {
      const { to, clientFullName, clientUrl } = job.data as AtRiskAlertEmailJob;
      await emailService.sendAtRiskAlertEmail(to, clientFullName, clientUrl);
      return;
    }
    case 'new-message': {
      const { to, senderName, threadUrl } = job.data as NewMessageEmailJob;
      await emailService.sendNewMessageEmail(to, senderName, threadUrl);
      return;
    }
    case 'payment-receipt': {
      const { to, planLabel, amountInPaise, currency } = job.data as PaymentReceiptEmailJob;
      await emailService.sendPaymentReceiptEmail(to, planLabel, amountInPaise, currency);
      return;
    }
    default:
      throw new Error(`Unknown email job: ${job.name}`);
  }
}
