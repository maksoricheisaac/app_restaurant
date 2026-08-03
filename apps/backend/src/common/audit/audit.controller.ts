import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { getSkipTake, toPaginated } from '../pagination/paginate';

/**
 * Consultation de la piste d'audit. Lecture seule, propriétaire uniquement :
 * la table n'est ni modifiable ni purgeable par l'application, c'est ce qui
 * lui donne sa valeur.
 */
@Controller('/audit')
@UseGuards(AuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('owner')
  async findAll(
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const {
      skip,
      take,
      page: p,
      limit: l,
    } = getSkipTake(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );

    const { data, total } = await this.auditService.findAll({
      action,
      entity,
      entityId,
      userId,
      dateFrom,
      dateTo,
      skip,
      take,
    });

    return toPaginated(data, total, p, l);
  }
}
