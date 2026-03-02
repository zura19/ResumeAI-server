import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Welcometemplate } from './templates/welcome.template';
import { planUpgradeTemplate } from './templates/plan-upgrade.template';
import { PlanName } from '@prisma/client';
import { SubscriptionCanceltemplate } from './templates/subscription-cancel.template';
import { MailerService } from '@nestjs-modules/mailer';
import * as Mailjet from 'node-mailjet';

@Injectable()
export class EmailService {
  private mailjet;
  constructor(
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {
    this.mailjet = Mailjet.Client.apiConnect(
      this.configService.get<string>('MAILJET_API_KEY')!,
      this.configService.get<string>('MAILJET_API_SECRET')!,
    );
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const request = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: process.env.MAIL_FROM_EMAIL!,
                Name: process.env.MAIL_FROM_NAME!,
              },
              To: [
                {
                  Email: to,
                },
              ],
              Subject: subject,
              htmlPart: html,
            },
          ],
        });

      return request.body;
    } catch (error) {
      console.error('Mailjet error:', error);
      throw error;
    }
  }

  async test(to: string) {
    await this.sendEmail(to, 'test', `<h1>${Math.random() * 100}</h1>`);
    // await this.mailerService.sendMail({
    //   to,
    //   subject: 'Welcome to ResumeAI!',
    //   html: `<h1>${Math.random() * 100}, is the random number</h1>`,
    // });
  }

  async sendWelcomeEmail(user: { email: string; firstName: string }) {
    const sendTemplate = Welcometemplate.replaceAll(
      '{{NAME}}',
      user.firstName,
    ).replaceAll('{{LINK}}', this.configService.get<string>('CLIENT_URL')!);

    await this.sendEmail(user.email, 'Welcome to ResumeAI!', sendTemplate);
    // await this.mailerService.sendMail({
    //   to: user.email,
    //   subject: 'Welcome to ResumeAI',
    //   html: Welcometemplate.replaceAll('{{NAME}}', user.firstName).replaceAll(
    //     '{{LINK}}',
    //     this.configService.get<string>('CLIENT_URL')!,
    //   ),
    // });
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

    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: 'Payment Confirmation',
    //   html: planUpgradeTemplate
    //     .replaceAll(
    //       '{{PROFILE_LINK}}',
    //       this.configService.get<string>('CLIENT_URL')! + '/profile',
    //     )
    //     .replaceAll('{{PLAN_NAME}}', upperCasePlan)
    //     .replaceAll('{{AMOUNT}}', formatedAmount)
    //     .replaceAll('{{DATE}}', endDateToString),
    // });
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

    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: 'Subscription Canceled',
    //   html: SubscriptionCanceltemplate.replaceAll(
    //     '{{LINK}}',
    //     this.configService.get<string>('CLIENT_URL')! + '/plans',
    //   )
    //     .replaceAll('{{PREVIOUS_PLAN}}', upperCasePlan)
    //     .replaceAll('{{DATE}}', endDateToString),
    // });
  }
}
