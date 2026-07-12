import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { hours, minutes, Throttle } from '@nestjs/throttler';
import type { User } from '@prisma/client';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { OptionalJwtGuard } from 'src/common/guards/optional-jwt.guard';
import type { ApiResponse } from 'src/common/interceptors/response.interface';
import { ContactRequestDto } from './dto/contact-request.dto';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('contact')
  @UseGuards(OptionalJwtGuard)
  @Throttle({
    default: { limit: 3, ttl: hours(1), blockDuration: minutes(10) },
  })
  async contact(
    @Body() body: ContactRequestDto,
    @UserDecorator() user: User | null,
  ): Promise<ApiResponse<null>> {
    await this.emailService.sendContactRequest(body, user);

    return { data: null, message: 'Message sent successfully' };
  }

  // @Get('test/:email')
  // async test(@Param('email') email: string) {
  //   const to = email;
  //   const d = await this.emailService.test(to);
  //   return { message: 'email sent' };
  // }
}
