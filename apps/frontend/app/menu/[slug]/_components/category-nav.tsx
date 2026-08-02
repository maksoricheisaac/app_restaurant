'use client';

import { useEffect, useRef } from 'react';
import { Chip } from './primitives';
import { WARM, withAlpha } from '../_lib/theme';

interface Cat {
  id: string;
  name: string;
}

/**
 * Barre de catégories sticky, scroll-spy accessible.
 * Contrôlée : l'état actif et le scroll-spy sont gérés par le parent
 * (MenuExperience), ce composant ne fait que rendre + auto-scroller la puce
 * active dans la vue horizontale et exposer aria-current.
 */
export function CategoryNav({
  categories,
  active,
  color,
  onBrand,
  onSelect,
}: {
  categories: Cat[];
  active: string;
  color: string;
  onBrand: string;
  onSelect: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLElement | null>>({});

  // Garde la puce active visible dans le défilement horizontal.
  useEffect(() => {
    const chip = chipRefs.current[active];
    const scroller = scrollerRef.current;
    if (!chip || !scroller) return;
    const cLeft = chip.offsetLeft;
    const cRight = cLeft + chip.offsetWidth;
    const vLeft = scroller.scrollLeft;
    const vRight = vLeft + scroller.clientWidth;
    if (cLeft < vLeft + 16) scroller.scrollTo({ left: cLeft - 16, behavior: 'smooth' });
    else if (cRight > vRight - 16)
      scroller.scrollTo({ left: cRight - scroller.clientWidth + 16, behavior: 'smooth' });
  }, [active]);

  if (categories.length <= 1) return null;

  return (
    <nav
      aria-label="Catégories du menu"
      className="sticky top-0 z-20 backdrop-blur-xl"
      style={{
        backgroundColor: withAlpha(WARM.page, 0.9),
        borderBottom: `1px solid ${WARM.border}`,
      }}
    >
      <div
        ref={scrollerRef}
        className="scrollbar-none mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2.5"
      >
        {categories.map((cat) => (
          <span key={cat.id} ref={(el) => { chipRefs.current[cat.id] = el; }} className="flex">
            <Chip
              active={active === cat.id}
              ariaCurrent={active === cat.id}
              color={color}
              onBrand={onBrand}
              onClick={() => onSelect(cat.id)}
            >
              {cat.name}
            </Chip>
          </span>
        ))}
      </div>
    </nav>
  );
}
