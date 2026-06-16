export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

/**
 * Normalise page/limit et calcule le skip/take Prisma correspondant.
 * limit est borné à MAX_PAGE_LIMIT pour éviter les requêtes non bornées.
 */
export function getSkipTake(page?: number, limit?: number) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_PAGE_LIMIT, 1),
    MAX_PAGE_LIMIT,
  );
  const safePage = Math.max(Number(page) || 1, 1);

  return { skip: (safePage - 1) * safeLimit, take: safeLimit, page: safePage, limit: safeLimit };
}

export function toPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
