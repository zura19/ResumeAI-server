import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';

@UseGuards(JwtGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('/subscriptions/count')
  async countSubscriptions(): Promise<
    ApiResponse<{ free: number; pro: number; enterprise: number }>
  > {
    try {
      const counts = await this.adminService.countSubscriptions();
      return {
        data: counts,
      };
    } catch (error) {
      console.error('Error counting plans:', error);
      throw error;
    }
  }
}
