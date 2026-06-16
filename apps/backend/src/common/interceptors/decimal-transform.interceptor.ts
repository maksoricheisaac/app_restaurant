import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Duck-typing : évite l'import fragile de @prisma/client/runtime/library
function isDecimalLike(val: unknown): val is { toNumber(): number } {
  return (
    val !== null &&
    typeof val === 'object' &&
    'toNumber' in val &&
    typeof (val as Record<string, unknown>)['toNumber'] === 'function'
  );
}

function transformDecimals(value: unknown): unknown {
  if (isDecimalLike(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(transformDecimals);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        transformDecimals(v),
      ]),
    );
  }
  return value;
}

// Convertit tous les Prisma.Decimal en number dans les réponses JSON.
// Nécessaire depuis la migration Float → Decimal sur les champs monétaires.
@Injectable()
export class DecimalTransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(transformDecimals));
  }
}
