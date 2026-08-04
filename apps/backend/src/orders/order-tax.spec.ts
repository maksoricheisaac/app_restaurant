import {
  buildTaxBuckets,
  roundMoney,
  splitTax,
  sumTaxedAmounts,
  taxForLine,
} from './order-tax';

/**
 * Calcul de la TVA. Ces tests fixent les propriétés dont dépend la justesse
 * d'un ticket : cohérence HT + TVA = TTC, sens de calcul selon que les prix
 * affichés sont TTC ou HT, et arrondis qui ne dérivent pas sur les quantités.
 */
describe('roundMoney', () => {
  it('arrondit au centime supérieur à la moitié', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
  });

  it('n’altère pas un montant déjà rond', () => {
    expect(roundMoney(12)).toBe(12);
    expect(roundMoney(12.34)).toBe(12.34);
  });

  it('ramène une valeur non finie à zéro plutôt que de propager NaN', () => {
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('splitTax — prix affichés TTC', () => {
  it('extrait la taxe du montant au lieu de l’ajouter', () => {
    const result = splitTax(120, 20, true);

    expect(result.inclTax).toBe(120);
    expect(result.exclTax).toBe(100);
    expect(result.tax).toBe(20);
  });

  it('garantit HT + TVA = TTC même quand la division tombe mal', () => {
    // 9,90 € à 5,5 % : la base exacte est 9,3838... — l'arrondi ne doit pas
    // faire perdre un centime au passage.
    const result = splitTax(9.9, 5.5, true);

    expect(result.inclTax).toBe(9.9);
    expect(roundMoney(result.exclTax + result.tax)).toBe(9.9);
  });

  it.each([
    [10, 20],
    [7.35, 10],
    [23.45, 5.5],
    [199.99, 20],
  ])('reste cohérent pour %s € à %s %%', (amount, rate) => {
    const result = splitTax(amount, rate, true);
    expect(roundMoney(result.exclTax + result.tax)).toBe(roundMoney(amount));
  });
});

describe('splitTax — prix affichés HT', () => {
  it('ajoute la taxe au montant', () => {
    const result = splitTax(100, 20, false);

    expect(result.exclTax).toBe(100);
    expect(result.tax).toBe(20);
    expect(result.inclTax).toBe(120);
  });

  it('donne un résultat différent du sens TTC pour le même nombre affiché', () => {
    // C'est toute la raison d'être du paramètre : 100 € n'est pas le même
    // montant selon qu'il est saisi TTC ou HT.
    const inclusive = splitTax(100, 20, true);
    const exclusive = splitTax(100, 20, false);

    expect(inclusive.exclTax).not.toBe(exclusive.exclTax);
    expect(inclusive.inclTax).toBe(100);
    expect(exclusive.inclTax).toBe(120);
  });
});

describe('splitTax — taux nul', () => {
  it.each([true, false])(
    'laisse le montant intact et ne facture aucune taxe (prix TTC : %s)',
    (pricesIncludeTax) => {
      const result = splitTax(42.5, 0, pricesIncludeTax);

      expect(result.exclTax).toBe(42.5);
      expect(result.tax).toBe(0);
      expect(result.inclTax).toBe(42.5);
      expect(result.rate).toBe(0);
    },
  );

  it('traite un taux négatif comme absent', () => {
    expect(splitTax(50, -5, true).tax).toBe(0);
  });
});

describe('taxForLine', () => {
  it('calcule sur la ligne entière, pas sur le prix unitaire', () => {
    // 3 × 3,33 € à 20 %, prix TTC.
    //   Par unité : 3,33 / 1,2 = 2,775 → 2,78 HT, soit 0,55 de taxe.
    //   Multiplié par 3 : 1,65.
    //   Sur la ligne : 9,99 / 1,2 = 8,325 → 8,33 HT, soit 1,66 de taxe.
    // Un centime d'écart par ligne, qui s'accumule sur un ticket entier.
    const line = taxForLine(3.33, 3, 20, true);

    expect(line.inclTax).toBe(9.99);
    expect(line.exclTax).toBe(8.33);
    expect(line.tax).toBe(1.66);
    expect(roundMoney(line.exclTax + line.tax)).toBe(9.99);
  });

  it('multiplie correctement une quantité simple', () => {
    const line = taxForLine(12, 2, 20, false);

    expect(line.exclTax).toBe(24);
    expect(line.tax).toBe(4.8);
    expect(line.inclTax).toBe(28.8);
  });
});

describe('sumTaxedAmounts', () => {
  it('somme les montants déjà arrondis de chaque ligne', () => {
    const totals = sumTaxedAmounts([
      { taxRate: 20, lineExclTax: 100, lineTax: 20, lineInclTax: 120 },
      { taxRate: 10, lineExclTax: 50, lineTax: 5, lineInclTax: 55 },
    ]);

    expect(totals.subtotalExclTax).toBe(150);
    expect(totals.taxTotal).toBe(25);
    expect(totals.totalInclTax).toBe(175);
  });

  it('rend le total exactement égal à la somme des lignes imprimées', () => {
    // Trois lignes dont les taxes finissent en demi-centime : le total doit
    // rester la somme de ce que le client lit, pas un recalcul global.
    const lines = [
      { taxRate: 20, lineExclTax: 8.25, lineTax: 1.65, lineInclTax: 9.9 },
      { taxRate: 20, lineExclTax: 8.25, lineTax: 1.65, lineInclTax: 9.9 },
      { taxRate: 20, lineExclTax: 8.25, lineTax: 1.65, lineInclTax: 9.9 },
    ];
    const totals = sumTaxedAmounts(lines);

    expect(totals.totalInclTax).toBe(29.7);
    expect(roundMoney(totals.subtotalExclTax + totals.taxTotal)).toBe(29.7);
  });

  it('rend des totaux nuls pour un ticket vide', () => {
    expect(sumTaxedAmounts([])).toEqual({
      subtotalExclTax: 0,
      taxTotal: 0,
      totalInclTax: 0,
    });
  });
});

describe('buildTaxBuckets', () => {
  it('regroupe les lignes par taux et trie du plus faible au plus élevé', () => {
    const buckets = buildTaxBuckets([
      { taxRate: 20, lineExclTax: 10, lineTax: 2, lineInclTax: 12 },
      { taxRate: 10, lineExclTax: 30, lineTax: 3, lineInclTax: 33 },
      { taxRate: 20, lineExclTax: 5, lineTax: 1, lineInclTax: 6 },
    ]);

    expect(buckets).toEqual([
      { rate: 10, exclTax: 30, tax: 3, inclTax: 33 },
      { rate: 20, exclTax: 15, tax: 3, inclTax: 18 },
    ]);
  });

  it('produit une seule tranche quand tout est au même taux', () => {
    const buckets = buildTaxBuckets([
      { taxRate: 20, lineExclTax: 10, lineTax: 2, lineInclTax: 12 },
      { taxRate: 20, lineExclTax: 10, lineTax: 2, lineInclTax: 12 },
    ]);

    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toEqual({ rate: 20, exclTax: 20, tax: 4, inclTax: 24 });
  });

  it('range les lignes exonérées dans une tranche à 0 %', () => {
    const buckets = buildTaxBuckets([
      { taxRate: 0, lineExclTax: 10, lineTax: 0, lineInclTax: 10 },
    ]);

    expect(buckets).toEqual([{ rate: 0, exclTax: 10, tax: 0, inclTax: 10 }]);
  });

  it('ne rend aucune tranche pour un ticket vide', () => {
    expect(buildTaxBuckets([])).toEqual([]);
  });
});
