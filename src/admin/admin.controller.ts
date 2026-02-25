import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiResponse } from 'src/common/interceptors/response.interface';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { TotalsResponseDto } from './dtos/totals-response.dto';
import { Payment } from '@prisma/client';

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

  @Get('/totals')
  async getTotals(): Promise<ApiResponse<TotalsResponseDto>> {
    try {
      const totals = await this.adminService.getTotals();
      return {
        data: totals,
      };
    } catch (error) {
      console.error('Error getting totals:', error);
      throw error;
    }
  }

  @Get('/payments')
  async getPayments(
    @Query() query: any,
  ): Promise<ApiResponse<{ payments: Payment[]; hasMore: boolean }>> {
    try {
      const payments = await this.adminService.getPayments(query);
      return {
        data: payments,
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  @Get('/users')
  async getUsers(@Query() query: any): Promise<ApiResponse<{ users: any[] }>> {
    try {
      const users = await this.adminService.getUsers(query);
      return {
        data: users,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}
