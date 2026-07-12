import { Controller, Get, UseGuards } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('/domains')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class DomainsController {
  constructor(private readonly domains: DomainsService) {}

  @Get()
  list() {
    return this.domains.listAll();
  }
}
