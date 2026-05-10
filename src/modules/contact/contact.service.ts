import { logger } from '../../lib/logger';

export async function logContactSubmission(data: { name: string; email: string; subject: string; message: string }) {
  logger.info(
    { name: data.name, email: data.email, subject: data.subject, message: data.message.substring(0, 200) },
    'Contact form submission'
  );
}
