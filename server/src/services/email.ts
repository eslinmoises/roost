import { emailText, emailLocale } from '../locales/index.js';
import { notificationCopy } from '../locales/notifications.js';
import nodemailer, { type Transporter } from 'nodemailer';

// HTML escape function to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeHeader(value: string): string {
  return value.replace(/[\r\n\0]/g, ' ').trim().slice(0, 200);
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';
    this.fromName = process.env.SMTP_FROM_NAME || 'Roost';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration incomplete. Email sending disabled.');
      return;
    }

    const config: EmailConfig = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify SMTP connection on startup
    void this.transporter.verify()
      .then(() => console.log('SMTP connection verified successfully'))
      .catch((error: Error) => console.error('SMTP connection verification failed:', error.message));
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not configured. Check SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(params: {
    email: string;
    name: string;
    productName: string;
    variantName?: string;
    resetPasswordUrl: string;
  }): Promise<boolean> {
    const { email, name, productName, variantName, resetPasswordUrl } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || emailText('nameFallback'));
    const safeProductName = escapeHtml(productName);
    const safeEmail = escapeHtml(email);
    const planType = escapeHtml(variantName || emailText('subscription'));
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    const html = emailText("WelcomeHtml0", { fromName: escapeHtml(this.fromName), safeName: safeName, safeProductName: safeProductName, planType: planType, safeEmail: safeEmail, resetPasswordUrl: resetPasswordUrl, year: new Date().getFullYear(), frontendUrl: frontendUrl });

    const text = emailText("WelcomeText1", { fromName: this.fromName, safeName: safeName, safeProductName: safeProductName, planType: planType, safeEmail: safeEmail, resetPasswordUrl: resetPasswordUrl });

    return this.sendEmail({
      to: email,
      subject: emailText("WelcomeSubject2", { fromName: this.fromName, productName: productName }),
      html,
      text,
    });
  }

  async sendSubscriptionCancelledEmail(params: {
    email: string;
    name: string;
    productName: string;
    gracePeriodEnds: Date;
  }): Promise<boolean> {
    const { email, name, productName, gracePeriodEnds } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || emailText('nameFallback'));
    const safeProductName = escapeHtml(productName);
    const formattedDate = gracePeriodEnds.toLocaleDateString(emailLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = emailText("SubscriptionCancelledHtml3", { safeName: safeName, safeProductName: safeProductName, formattedDate: formattedDate, fromName: escapeHtml(this.fromName) });

    return this.sendEmail({
      to: email,
      subject: emailText("SubscriptionCancelledSubject4", { productName: productName }),
      text: emailText("SubscriptionCancelledText", { safeName, safeProductName, formattedDate, fromName: this.fromName }),
      html,
    });
  }

  async sendSubscriptionReactivatedEmail(params: {
    email: string;
    name: string;
    productName: string;
  }): Promise<boolean> {
    const { email, name, productName } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || emailText('nameFallback'));
    const safeProductName = escapeHtml(productName);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    const html = emailText("SubscriptionReactivatedHtml5", { safeName: safeName, safeProductName: safeProductName, frontendUrl: frontendUrl, fromName: escapeHtml(this.fromName) });

    return this.sendEmail({
      to: email,
      subject: emailText("SubscriptionReactivatedSubject6", { productName: productName }),
      text: emailText("SubscriptionReactivatedText", { safeName, safeProductName, frontendUrl, fromName: this.fromName }),
      html,
    });
  }

  async sendPasswordResetEmail(params: {
    email: string;
    name: string;
    resetUrl: string;
  }): Promise<boolean> {
    const { email, name, resetUrl } = params;
    // Escape user-provided data to prevent XSS
    const safeName = escapeHtml(name || emailText('nameFallback'));
    const safeEmail = escapeHtml(email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    const html = emailText("PasswordResetHtml7", { safeName: safeName, fromName: escapeHtml(this.fromName), safeEmail: safeEmail, resetUrl: resetUrl, year: new Date().getFullYear(), frontendUrl: frontendUrl });

    const text = emailText("PasswordResetText8", { safeName: safeName, fromName: this.fromName, safeEmail: safeEmail, resetUrl: resetUrl });

    return this.sendEmail({
      to: email,
      subject: emailText("PasswordResetSubject9", { fromName: this.fromName }),
      html,
      text,
    });
  }

  async sendNotificationEmail(params: {
    to: string;
    userName: string;
    notificationType: string;
    title: string;
    message?: string;
    link?: string;
  }): Promise<boolean> {
    const { to, userName, notificationType, title: storedTitle, message: storedMessage, link } = params;
    const { title, message } = notificationCopy(notificationType, storedTitle, storedMessage);
    const safeName = escapeHtml(userName || emailText('nameFallback'));
    const safeTitle = escapeHtml(title);
    const safeMessage = message ? escapeHtml(message) : '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    // Get notification type specific styling
    const styles = this.getNotificationTypeStyles(notificationType, title);
    const { color, icon } = styles;
    const subject = safeHeader(styles.subject);
    const safeSubject = escapeHtml(subject);
    let safeLink = '';
    if (link) {
      try {
        const candidate = new URL(link, frontendUrl);
        const allowedOrigin = new URL(frontendUrl).origin;
        if (candidate.origin === allowedOrigin) safeLink = escapeHtml(candidate.toString());
      } catch {
        safeLink = '';
      }
    }

    const html = emailText("NotificationHtml10", { safeSubject: safeSubject, color: color, icon: icon, safeTitle: safeTitle, safeName: safeName, value5: safeMessage ? emailText("fragment1", { color: color, safeMessage: safeMessage, value2: safeMessage.length >= 100 ? '...' : '' }) : '', value6: safeLink ? emailText("fragment2", { safeLink: safeLink, color: color }) : '', frontendUrl: frontendUrl, year: new Date().getFullYear(), fromName: escapeHtml(this.fromName) });

    const text = emailText("NotificationText11", { title: title, safeName: safeName, value2: message || '', value3: link ? emailText("fragment3", { link: link }) : '', frontendUrl: frontendUrl, fromName: this.fromName });

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendActivationStatusEmail(params: {
    email: string;
    name: string;
    productName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    websiteUrl: string;
    adminNotes?: string;
  }): Promise<boolean> {
    const { email, name, productName, status, websiteUrl, adminNotes } = params;
    const safeName = escapeHtml(name || emailText('nameFallback'));
    const safeProductName = escapeHtml(productName);
    const safeWebsiteUrl = escapeHtml(websiteUrl);
    const safeAdminNotes = adminNotes ? escapeHtml(adminNotes) : '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    // Status-specific configuration
    const statusConfig = {
      pending: {
        color: '#f59e0b',
        icon: '⏳',
        title: emailText("ActivationStatusTitle12"),
        message: emailText("ActivationStatusMessage13", { safeProductName: safeProductName }),
      },
      in_progress: {
        color: '#3b82f6',
        icon: '⚙️',
        title: emailText("ActivationStatusTitle14"),
        message: emailText("ActivationStatusMessage15", { safeProductName: safeProductName }),
      },
      completed: {
        color: '#10b981',
        icon: '✅',
        title: emailText("ActivationStatusTitle16"),
        message: emailText("ActivationStatusMessage17", { safeProductName: safeProductName }),
      },
      rejected: {
        color: '#ef4444',
        icon: '❌',
        title: emailText("ActivationStatusTitle18"),
        message: emailText("ActivationStatusMessage19", { safeProductName: safeProductName }),
      },
    };

    const config = statusConfig[status];

    const html = emailText("ActivationStatusHtml20", { config_title: config.title, config_color: config.color, config_icon: config.icon, safeName: safeName, config_message: config.message, safeProductName: safeProductName, safeWebsiteUrl: safeWebsiteUrl, value7: emailText(`status_${status}`), value8: safeAdminNotes ? emailText("fragment4", { safeAdminNotes: safeAdminNotes }) : '', frontendUrl: frontendUrl, fromName: escapeHtml(this.fromName), year: new Date().getFullYear() });

    const text = emailText("ActivationStatusText21", { config_title: config.title, safeName: safeName, value2: config.message.replace(/<[^>]*>/g, ''), safeProductName: safeProductName, safeWebsiteUrl: safeWebsiteUrl, value5: emailText(`status_${status}`), value6: safeAdminNotes ? emailText("fragment5", { safeAdminNotes: safeAdminNotes }) : '', frontendUrl: frontendUrl, fromName: this.fromName });

    return this.sendEmail({
      to: email,
      subject: emailText("ActivationStatusSubject22", { config_title: config.title, productName: productName }),
      html,
      text,
    });
  }

  private getNotificationTypeStyles(type: string, title: string): { color: string; icon: string; subject: string } {
    switch (type) {
      case 'new_comment':
        return {
          color: '#3b82f6', // blue
          icon: '💬',
          subject: emailText("getNotificationTypeStylesSubject23", { title: title }),
        };
      case 'comment_reply':
        return {
          color: '#06b6d4', // cyan
          icon: '↩️',
          subject: emailText("getNotificationTypeStylesSubject24", { title: title }),
        };
      case 'new_reaction':
        return {
          color: '#ef4444', // red
          icon: '❤️',
          subject: emailText("getNotificationTypeStylesSubject25", { title: title }),
        };
      case 'new_message':
        return {
          color: '#667eea', // primary
          icon: '✉️',
          subject: title,
        };
      case 'mention':
        return {
          color: '#f97316', // orange
          icon: '@',
          subject: emailText("getNotificationTypeStylesSubject26", { title: title }),
        };
      case 'group_invite':
        return {
          color: '#8b5cf6', // purple
          icon: '👥',
          subject: emailText("getNotificationTypeStylesSubject27", { title: title }),
        };
      case 'new_follower':
        return {
          color: '#22c55e', // green
          icon: '👤',
          subject: emailText("getNotificationTypeStylesSubject28", { title: title }),
        };
      case 'event_reminder':
        return {
          color: '#eab308', // yellow
          icon: '📅',
          subject: emailText("getNotificationTypeStylesSubject29", { title: title }),
        };
      default:
        return {
          color: '#667eea', // primary
          icon: '🔔',
          subject: title,
        };
    }
  }
}

export const emailService = new EmailService();
