/**
 * Calcul de la TVA.
 *
 * Module pur, sans base de données : c'est le seul endroit où se décide la
 * ventilation d'un montant entre base hors taxe et taxe. Les paramètres
 * `taxRate` et `taxIncluded` existaient dans la configuration de
 * l'établissement depuis l'origine sans qu'aucun calcul ne les lise ; ils
 * font désormais foi.
 */

/** Précision des montants stockés. Les colonnes sont en `Decimal`. */
const MONEY_DECIMALS = 2;

/**
 * Arrondi commercial (demi-supérieur) à deux décimales.
 *
 * `Math.round` seul est faux sur les binaires flottants : `Math.round(1.005 *
 * 100) / 100` rend 1 au lieu de 1,01, parce que 1.005 n'est pas représentable
 * exactement. Le passage par une chaîne exponentielle contourne la
 * représentation binaire.
 */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const shifted = Number(`${value}e${MONEY_DECIMALS}`);
  return Number(`${Math.round(shifted)}e-${MONEY_DECIMALS}`);
}

export interface TaxBreakdown {
  /** Base hors taxe. */
  exclTax: number;
  /** Montant de la taxe. */
  tax: number;
  /** Toutes taxes comprises. */
  inclTax: number;
  /** Taux appliqué, en pourcentage (20 = 20 %). */
  rate: number;
}

/**
 * Ventile un montant selon le sens de saisie des prix.
 *
 * `pricesIncludeTax = true` — les prix de la carte sont TTC, comme sur toute
 * carte affichée en salle : la taxe est **extraite** du montant.
 * `pricesIncludeTax = false` — les prix sont HT : la taxe s'**ajoute**.
 *
 * Les deux sens ne donnent pas le même résultat pour un même nombre affiché ;
 * c'est précisément pourquoi le paramètre existe et pourquoi il ne peut pas
 * être deviné.
 */
export function splitTax(
  amount: number,
  rate: number,
  pricesIncludeTax: boolean,
): TaxBreakdown {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 0;

  if (safeRate === 0) {
    const flat = roundMoney(amount);
    return { exclTax: flat, tax: 0, inclTax: flat, rate: 0 };
  }

  if (pricesIncludeTax) {
    const inclTax = roundMoney(amount);
    const exclTax = roundMoney(inclTax / (1 + safeRate / 100));
    // La taxe se déduit par différence plutôt que par un second arrondi :
    // c'est ce qui garantit que HT + TVA redonne exactement le TTC affiché.
    return {
      exclTax,
      tax: roundMoney(inclTax - exclTax),
      inclTax,
      rate: safeRate,
    };
  }

  const exclTax = roundMoney(amount);
  const tax = roundMoney(exclTax * (safeRate / 100));
  return { exclTax, tax, inclTax: roundMoney(exclTax + tax), rate: safeRate };
}

/**
 * Ventile une ligne entière, quantité comprise.
 *
 * La taxe est calculée sur le montant de la ligne et non sur le prix
 * unitaire : arrondir à l'unité puis multiplier par la quantité fait dériver
 * le total de plusieurs centimes dès qu'un article part en nombre.
 */
export function taxForLine(
  unitPrice: number,
  quantity: number,
  rate: number,
  pricesIncludeTax: boolean,
): TaxBreakdown {
  return splitTax(unitPrice * quantity, rate, pricesIncludeTax);
}

/** Une ligne déjà ventilée, telle qu'elle est stockée. */
export interface TaxedAmounts {
  taxRate: unknown;
  lineExclTax: unknown;
  lineTax: unknown;
  lineInclTax: unknown;
}

export interface TaxTotals {
  subtotalExclTax: number;
  taxTotal: number;
  totalInclTax: number;
}

/**
 * Additionne des lignes déjà ventilées.
 *
 * Sommer des montants arrondis plutôt que réarrondir la somme : le total du
 * ticket doit être exactement la somme des lignes imprimées, sinon le client
 * qui recompte trouve un écart d'un centime.
 */
export function sumTaxedAmounts(lines: TaxedAmounts[]): TaxTotals {
  const totals = lines.reduce(
    (acc, line) => ({
      subtotalExclTax: acc.subtotalExclTax + Number(line.lineExclTax ?? 0),
      taxTotal: acc.taxTotal + Number(line.lineTax ?? 0),
      totalInclTax: acc.totalInclTax + Number(line.lineInclTax ?? 0),
    }),
    { subtotalExclTax: 0, taxTotal: 0, totalInclTax: 0 },
  );

  return {
    subtotalExclTax: roundMoney(totals.subtotalExclTax),
    taxTotal: roundMoney(totals.taxTotal),
    totalInclTax: roundMoney(totals.totalInclTax),
  };
}

/** Une tranche de la ventilation imprimée en pied de ticket. */
export interface TaxBucket {
  rate: number;
  exclTax: number;
  tax: number;
  inclTax: number;
}

/**
 * Ventilation par taux, telle qu'elle doit figurer sur un ticket.
 *
 * Un ticket comportant plusieurs taux — un plat et une bouteille de vin, par
 * exemple — doit détailler la base et la taxe de chacun : un total global ne
 * permet ni au client ni au comptable de refaire le calcul.
 */
export function buildTaxBuckets(lines: TaxedAmounts[]): TaxBucket[] {
  const buckets = new Map<number, TaxBucket>();

  for (const line of lines) {
    const rate = Number(line.taxRate ?? 0);
    const bucket = buckets.get(rate) ?? {
      rate,
      exclTax: 0,
      tax: 0,
      inclTax: 0,
    };

    bucket.exclTax += Number(line.lineExclTax ?? 0);
    bucket.tax += Number(line.lineTax ?? 0);
    bucket.inclTax += Number(line.lineInclTax ?? 0);
    buckets.set(rate, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      rate: bucket.rate,
      exclTax: roundMoney(bucket.exclTax),
      tax: roundMoney(bucket.tax),
      inclTax: roundMoney(bucket.inclTax),
    }))
    .sort((a, b) => a.rate - b.rate);
}
