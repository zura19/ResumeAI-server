import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Get('test/:email')
  async test(@Param('email') email: string) {
    const to = email;
    const d = await this.emailService.test(to);
    return { message: 'email sent' };
  }
}
