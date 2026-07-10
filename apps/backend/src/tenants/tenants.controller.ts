import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import type { Tenant } from '@prisma/client';

@Controller('/tenants')
@UseGuards(AuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles('super_admin')
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Roles('super_admin', 'support')
  findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query() { page, limit }: PageQueryDto = {},
  ) {
    return this.tenantsService.findAll(includeDeleted === 'true', page, limit);
  }

  @Public()
  @Get('resolve/:slug')
  resolveBySlug(@Param('slug') slug: string) {
    return this.tenantsService.resolveBySlug(slug);
  }

  // Utilisé par app/sitemap.ts (frontend) pour générer un sitemap réel avec
  // les vraies pages /menu/[slug] plutôt que des routes statiques génériques.
  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Get('public-slugs')
  findAllPublicSlugs() {
    return this.tenantsService.findAllPublicSlugs();
  }

  // Returns current tenant profile for any authenticated member.
  // Must be declared BEFORE :id to avoid Express matching "me" as a param.
  @UseGuards(AuthGuard, TenantGuard)
  @Get('me')
  getMe(@CurrentTenant() tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      logo: tenant.logo,
      bannerUrl: (tenant as any).bannerUrl ?? null,
      primaryColor: tenant.primaryColor,
      cuisineType: tenant.cuisineType,
      currency: tenant.currency,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  @Get(':id')
  @Roles('super_admin', 'support')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles('super_admin')
  restore(@Param('id') id: string) {
    return this.tenantsService.restore(id);
  }
}
