import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendWelcomeEmail(user: { email: string; firstName: string }) {
    await this.resend.emails.send({
      from: this.configService.get<string>('FROM_EMAIL_ADDRESS')!,
      to: user.email,
      subject: 'Welcome to ResumeAI',
      html: `
      <div>
       <h1>Welcome to ResumeAI ${user.firstName}. </h1>
       <p>You are now on a free plan, you can upgrade to a paid plan to get more features</p>
      </div>
      `,
    });
  }
}
