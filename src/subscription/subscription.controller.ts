import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import type { Subscription, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/common/interceptors/response.interface';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.subscriptionService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/profile')
  async getUserSubscription(
    @UserDecorator() user: User,
  ): Promise<ApiResponse<any>> {
    const subscription = await this.subscriptionService.getUserSubscriptionInfo(
      user.id,
    );
    return {
      data: {
        userActions: {
          aiCreditsThisMonth: user.aiCreditsThisMonth,
          generatedResumesThisMonth: user.resumesThisMonth,
        },
        subscription,
      },
    };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
