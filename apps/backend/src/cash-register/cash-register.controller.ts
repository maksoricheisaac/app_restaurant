import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { OpenSessionDto, CloseSessionDto } from './dto/cash-session.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/cash-register')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('pay')
  @Roles('owner', 'manager', 'cashier')
  processPayment(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() data: ProcessPaymentDto,
  ) {
    return this.cashRegisterService.processPayment(tenant.id, {
      ...data,
      cashierId: user.id,
    });
  }

  @Get('transactions')
  @Roles('owner', 'manager', 'cashier')
  getTransactions(
    @CurrentTenant() tenant: Tenant,
    @Query() filters: TransactionFiltersDto,
  ) {
    return this.cashRegisterService.getTransactions(tenant.id, filters);
  }

  @Get('bilan')
  @Roles('owner', 'manager', 'cashier')
  getBilan(@CurrentTenant() tenant: Tenant, @Query('date') date: string) {
    return this.cashRegisterService.getBilan(
      tenant.id,
      date || new Date().toISOString().split('T')[0],
    );
  }

  @Get('unpaid-orders')
  @Roles('owner', 'manager', 'cashier')
  getUnpaidOrders(@CurrentTenant() tenant: Tenant) {
    return this.cashRegisterService.getUnpaidOrders(tenant.id);
  }

  // ─── Session de caisse ──────────────────────────────────────────────────

  @Post('session/open')
  @Roles('owner', 'manager', 'cashier')
  openSession(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: OpenSessionDto,
  ) {
    return this.cashRegisterService.openSession(tenant.id, user.id, dto);
  }

  @Post('session/close')
  @Roles('owner', 'manager', 'cashier')
  closeSession(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: any,
    @Body() dto: CloseSessionDto,
  ) {
    return this.cashRegisterService.closeSession(tenant.id, user.id, dto);
  }

  @Get('session/current')
  @Roles('owner', 'manager', 'cashier')
  getCurrentSession(@CurrentTenant() tenant: Tenant) {
    return this.cashRegisterService.getCurrentSession(tenant.id);
  }

  @Get('session/history')
  @Roles('owner', 'manager')
  getSessionHistory(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cashRegisterService.getSessionHistory(
      tenant.id,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
