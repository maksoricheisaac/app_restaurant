import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { OpenSessionDto, CloseSessionDto } from './dto/cash-session.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('/cash-register')
@UseGuards(AuthGuard, RolesGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('pay')
  @Roles('owner', 'manager', 'cashier')
  processPayment(@CurrentUser() user: any, @Body() data: ProcessPaymentDto) {
    return this.cashRegisterService.processPayment({
      ...data,
      cashierId: user.id,
    });
  }

  @Get('transactions')
  @Roles('owner', 'manager', 'cashier')
  getTransactions(@Query() filters: TransactionFiltersDto) {
    return this.cashRegisterService.getTransactions(filters);
  }

  @Get('bilan')
  @Roles('owner', 'manager', 'cashier')
  getBilan(@Query('date') date: string) {
    return this.cashRegisterService.getBilan(
      date || new Date().toISOString().split('T')[0],
    );
  }

  @Get('unpaid-orders')
  @Roles('owner', 'manager', 'cashier')
  getUnpaidOrders() {
    return this.cashRegisterService.getUnpaidOrders();
  }

  // ─── Session de caisse ──────────────────────────────────────────────────

  @Post('session/open')
  @Roles('owner', 'manager', 'cashier')
  openSession(@CurrentUser() user: any, @Body() dto: OpenSessionDto) {
    return this.cashRegisterService.openSession(user.id, dto);
  }

  @Post('session/close')
  @Roles('owner', 'manager', 'cashier')
  closeSession(@CurrentUser() user: any, @Body() dto: CloseSessionDto) {
    return this.cashRegisterService.closeSession(user.id, dto);
  }

  @Get('session/current')
  @Roles('owner', 'manager', 'cashier')
  getCurrentSession() {
    return this.cashRegisterService.getCurrentSession();
  }

  @Get('session/history')
  @Roles('owner', 'manager')
  getSessionHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cashRegisterService.getSessionHistory(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
