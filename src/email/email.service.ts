import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Welcometemplate } from './templates/welcome.template';
import { planUpgradeTemplate } from './templates/plan-upgrade.template';
import { PlanName } from '@prisma/client';
import { SubscriptionCanceltemplate } from './templates/subscription-cancel.template';
import { Resend } from 'resend';
import type { User } from '@prisma/client';
import { escapeHtml } from 'src/common/helpers/escape-html.helper';
import { ContactRequestDto } from './dto/contact-request.dto';
import { contactRequestTemplate } from './templates/contact-request.template';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY')!);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await this.resend.emails.send({
        from: this.configService.get<string>('CONTACT_EMAIL_ADDRESS')!,
        to,
        subject,
        html,
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Resend error:', error);
      throw error;
    }
  }

  async sendContactRequest(
    request: ContactRequestDto,
    user: User | null,
  ): Promise<void> {
    const from = this.configService.get<string>('CONTACT_EMAIL_ADDRESS');
    const supportInbox =
      this.configService.get<string>('SUPPORT_EMAIL_ADDRESS') ?? from;

    if (!from || !supportInbox) {
      throw new InternalServerErrorException('Contact email is not configured');
    }

    const replyTo = user?.email ?? request.email;
    const sendTemplate = contactRequestTemplate
      .replaceAll('{{REPLY_TO}}', escapeHtml(replyTo))
      .replaceAll('{{USER_ID}}', escapeHtml(user?.id ?? 'Guest'))
      .replaceAll('{{TITLE}}', escapeHtml(request.title))
      .replaceAll(
        '{{DESCRIPTION}}',
        escapeHtml(request.description).replace(/\r?\n/g, '<br />'),
      );

    const response = await this.resend.emails.send({
      from,
      to: supportInbox,
      replyTo,
      subject: `Contact request: ${request.title}`,
      html: sendTemplate,
    });

    if (response.error) {
      console.error('Resend error:', response.error);
      throw response.error;
    }
  }

  async test(to: string) {
    const sendTemplate = Welcometemplate.replaceAll(
      '{{NAME}}',
      'Zura',
    ).replaceAll('{{LINK}}', this.configService.get<string>('CLIENT_URL')!);

    await this.sendEmail(to, 'Welcome to ResumeAI!', sendTemplate);
  }

  async sendWelcomeEmail(user: { email: string; firstName: string }) {
    const sendTemplate = Welcometemplate.replaceAll(
      '{{NAME}}',
      user.firstName,
    ).replaceAll('{{LINK}}', this.configService.get<string>('CLIENT_URL')!);

    await this.sendEmail(user.email, 'Welcome to ResumeAI!', sendTemplate);
  }

  async sendPaymentConfirmationEmail(
    email: string,
    data: { Plan: PlanName; amount: number; endDate: Date },
  ) {
    const upperCasePlan =
      data.Plan.charAt(0).toUpperCase() + data.Plan.slice(1);
    const endDateToString = data.endDate.toISOString().split('T')[0];
    const formatedAmount = '$' + data.amount.toFixed(2);

    const sendTemplate = planUpgradeTemplate
      .replaceAll(
        '{{PROFILE_LINK}}',
        this.configService.get<string>('CLIENT_URL')! + '/profile',
      )
      .replaceAll('{{PLAN_NAME}}', upperCasePlan)
      .replaceAll('{{AMOUNT}}', formatedAmount)
      .replaceAll('{{DATE}}', endDateToString);

    await this.sendEmail(email, 'Payment Confirmation', sendTemplate);
  }

  async sendSubscriptionCanceledEmail(email: string, data: { Plan: PlanName }) {
    const upperCasePlan =
      data.Plan.charAt(0).toUpperCase() + data.Plan.slice(1);
    const endDateToString = new Date().toISOString().split('T')[0];

    const sendTemplate = SubscriptionCanceltemplate.replaceAll(
      '{{LINK}}',
      this.configService.get<string>('CLIENT_URL')! + '/plans',
    )
      .replaceAll('{{PREVIOUS_PLAN}}', upperCasePlan)
      .replaceAll('{{DATE}}', endDateToString);

    await this.sendEmail(email, 'Subscription Canceled', sendTemplate);
  }
}
