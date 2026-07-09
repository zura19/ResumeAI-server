import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import type { ApiResponse } from 'src/common/interceptors/response.interface';
import { ContactRequestDto } from './dto/contact-request.dto';
import { EmailService } from './email.service';
import { OptionalJwtGuard } from './guards/optional-jwt.guard';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('contact')
  @UseGuards(OptionalJwtGuard)
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
