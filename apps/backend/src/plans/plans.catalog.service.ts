import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlanLimits,
  PlanFeatures,
  DEFAULT_FEATURES,
  FALLBACK_LIMITS,
  fromDbLimit,
} from './plans.config';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

/** Plan normalisé pour la consommation front (pricing, onboarding, super-admin). */
export interface PlanCatalogEntry {
  key: string;
  name: string;
  tagline: string | null;
  description: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  limits: {
    maxMenuItems: number; // -1 = illimité (conservé tel quel pour le front)
    maxTables: number;
    maxStaffMembers: number;
    maxMonthlyOrders: number;
  };
  features: PlanFeatures;
  highlights: string[];
  badge: string | null;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  /** Visible mais non souscriptible (ex : « Bientôt disponible »). */
  comingSoon: boolean;
}

/** Clé du plan de repli — ne peut être ni supprimée ni désactivée. */
const SYSTEM_PLAN_KEY = 'free';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  // Cache mémoire court : les plans changent rarement mais sont lus à chaque
  // requête soumise à quota. Invalidé explicitement à chaque écriture ; le TTL
  // borne la fraîcheur pour les autres instances éventuelles.
  private cache: { data: Plan[]; at: number } | null = null;
  private readonly TTL_MS = 30_000;

  constructor(private readonly prisma: PrismaService) {}

  // ─── Cache ────────────────────────────────────────────────────────────────

  private async loadAll(): Promise<Plan[]> {
    if (this.cache && Date.now() - this.cache.at < this.TTL_MS) {
      return this.cache.data;
    }
    const data = await this.prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    this.cache = { data, at: Date.now() };
    return data;
  }

  private invalidate() {
    this.cache = null;
  }

  // ─── Résolution des limites (utilisée par l'enforcement des quotas) ────────

  private toLimits(plan: Plan): PlanLimits {
    const features: PlanFeatures = {
      ...DEFAULT_FEATURES,
      ...((plan.features as Record<string, boolean>) ?? {}),
    };
    return {
      maxMenuItems: fromDbLimit(plan.maxMenuItems),
      maxTables: fromDbLimit(plan.maxTables),
      maxStaffMembers: fromDbLimit(plan.maxStaffMembers),
      maxMonthlyOrders: fromDbLimit(plan.maxMonthlyOrders),
      features,
    };
  }

  /** Limites applicatives pour une clé de plan. Repli restrictif si introuvable. */
  async getLimits(key: string): Promise<PlanLimits> {
    const plans = await this.loadAll();
    const plan = plans.find((p) => p.key === key);
    if (!plan) {
      this.logger.warn(
        `Plan "${key}" introuvable — repli sur les limites gratuites`,
      );
      return FALLBACK_LIMITS;
    }
    return this.toLimits(plan);
  }

  // ─── Catalogue (lecture publique / onboarding / super-admin) ──────────────

  private toCatalogEntry(plan: Plan): PlanCatalogEntry {
    return {
      key: plan.key,
      name: plan.name,
      tagline: plan.tagline,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      currency: plan.currency,
      limits: {
        maxMenuItems: plan.maxMenuItems,
        maxTables: plan.maxTables,
        maxStaffMembers: plan.maxStaffMembers,
        maxMonthlyOrders: plan.maxMonthlyOrders,
      },
      features: {
        ...DEFAULT_FEATURES,
        ...((plan.features as Record<string, boolean>) ?? {}),
      },
      highlights: plan.highlights ?? [],
      badge: plan.badge,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder,
      comingSoon: plan.isPublic && !plan.isActive,
    };
  }

  /** Catalogue public (pricing + onboarding) : plans publics uniquement. */
  async getPublicCatalog(): Promise<PlanCatalogEntry[]> {
    const plans = await this.loadAll();
    return plans.filter((p) => p.isPublic).map((p) => this.toCatalogEntry(p));
  }

  /** Une entrée de catalogue par clé (ou null). */
  async getCatalogEntry(key: string): Promise<PlanCatalogEntry | null> {
    const plans = await this.loadAll();
    const plan = plans.find((p) => p.key === key);
    return plan ? this.toCatalogEntry(plan) : null;
  }

  // ─── CRUD Super Admin ─────────────────────────────────────────────────────

  /** Tous les plans (y compris privés/inactifs) — vue super-admin. */
  async adminList(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async adminGet(id: string): Promise<Plan> {
    const plan = await this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Plan introuvable');
    return plan;
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const existing = await this.prisma.plan.findUnique({
      where: { key: dto.key },
    });
    if (existing)
      throw new ConflictException(`La clé de plan "${dto.key}" existe déjà`);

    const plan = await this.prisma.plan.create({
      data: {
        key: dto.key,
        name: dto.name,
        tagline: dto.tagline ?? null,
        description: dto.description ?? null,
        monthlyPrice: dto.monthlyPrice ?? 0,
        annualPrice: dto.annualPrice ?? 0,
        currency: dto.currency ?? 'EUR',
        maxMenuItems: dto.maxMenuItems ?? -1,
        maxTables: dto.maxTables ?? -1,
        maxStaffMembers: dto.maxStaffMembers ?? -1,
        maxMonthlyOrders: dto.maxMonthlyOrders ?? -1,
        features: (dto.features ?? {}) as any,
        highlights: dto.highlights ?? [],
        badge: dto.badge ?? null,
        isActive: dto.isActive ?? true,
        isPublic: dto.isPublic ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    this.invalidate();
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const current = await this.adminGet(id);

    // La clé du plan système ne peut pas changer (elle est le repli/def par défaut).
    if (current.key === SYSTEM_PLAN_KEY) {
      if (dto.key && dto.key !== SYSTEM_PLAN_KEY) {
        throw new BadRequestException(
          'La clé du plan gratuit système est immuable',
        );
      }
      if (dto.isActive === false) {
        throw new BadRequestException(
          'Le plan gratuit système ne peut pas être désactivé',
        );
      }
    }

    // Interdit de renommer une clé déjà prise par un autre plan.
    if (dto.key && dto.key !== current.key) {
      const clash = await this.prisma.plan.findUnique({
        where: { key: dto.key },
      });
      if (clash)
        throw new ConflictException(`La clé de plan "${dto.key}" existe déjà`);
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.features !== undefined) data.features = dto.features as any;

    const plan = await this.prisma.plan.update({ where: { id }, data });

    // Si la clé a changé, re-router les tenants rattachés vers la nouvelle clé.
    if (dto.key && dto.key !== current.key) {
      await this.prisma.tenant.updateMany({
        where: { plan: current.key },
        data: { plan: dto.key },
      });
    }

    this.invalidate();
    return plan;
  }

  async remove(id: string): Promise<{ success: true }> {
    const plan = await this.adminGet(id);

    if (plan.key === SYSTEM_PLAN_KEY) {
      throw new BadRequestException(
        'Le plan gratuit système ne peut pas être supprimé',
      );
    }

    // Contrainte métier : un plan encore souscrit par des restaurants actifs ne
    // peut pas être supprimé (sinon quotas orphelins).
    const inUse = await this.prisma.tenant.count({
      where: { plan: plan.key, deletedAt: null },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Ce plan est utilisé par ${inUse} restaurant(s). Migrez-les avant de le supprimer.`,
      );
    }

    await this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isPublic: false },
    });
    this.invalidate();
    return { success: true };
  }

  /** Active / désactive un plan (souscriptible ou non). */
  async setActive(id: string, isActive: boolean): Promise<Plan> {
    const plan = await this.adminGet(id);
    if (plan.key === SYSTEM_PLAN_KEY && !isActive) {
      throw new BadRequestException(
        'Le plan gratuit système ne peut pas être désactivé',
      );
    }
    const updated = await this.prisma.plan.update({
      where: { id },
      data: { isActive },
    });
    this.invalidate();
    return updated;
  }

  /** Vérifie qu'une clé de plan existe (souscriptible) — utilisé par le billing/tenants. */
  async assertSubscribable(key: string): Promise<Plan> {
    const plans = await this.loadAll();
    const plan = plans.find((p) => p.key === key);
    if (!plan) throw new NotFoundException(`Plan "${key}" introuvable`);
    if (!plan.isActive) {
      throw new BadRequestException(
        `Le plan "${key}" n'est pas disponible à la souscription`,
      );
    }
    return plan;
  }

  /** Vérifie simplement qu'une clé de plan existe (assignation admin). */
  async keyExists(key: string): Promise<boolean> {
    const plans = await this.loadAll();
    return plans.some((p) => p.key === key);
  }
}
