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
import { minutes, seconds, Throttle } from '@nestjs/throttler';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import type { Subscription, User } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/common/interceptors/response.interface';

@Controller('subscription')
@Throttle({
  default: { limit: 30, ttl: minutes(1), blockDuration: seconds(30) },
})
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Throttle({
    default: { limit: 5, ttl: minutes(1), blockDuration: seconds(30) },
  })
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
  @Throttle({
    default: { limit: 10, ttl: minutes(1), blockDuration: seconds(30) },
  })
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Throttle({
    default: { limit: 10, ttl: minutes(1), blockDuration: seconds(30) },
  })
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
