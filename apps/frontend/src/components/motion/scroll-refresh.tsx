'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

/**
 * Maintient les positions de déclenchement ScrollTrigger justes malgré les
 * variations de hauteur du document survenant APRÈS le calcul initial :
 *
 *  - images externes du hero (next/image) chargées de façon asynchrone,
 *  - substitution de la police variable Fraunces,
 *  - sections différées via <LazySection> (les témoignages) qui grandissent
 *    quand on les atteint et décalent tout ce qui suit (tarifs, CTA).
 *
 * Un ResizeObserver sur <body> rafraîchit ScrollTrigger (débounce) à chaque
 * changement de hauteur — sans ce filet, les sections lointaines ne se révèlent
 * jamais. ScrollTrigger gère déjà le resize de la fenêtre ; ici on couvre les
 * variations pilotées par le contenu.
 */
export function ScrollRefresh() {
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();

    let raf = 0;
    const scheduleRefresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    // Refresh initiaux (polices + fenêtre entièrement chargée).
    const t = setTimeout(refresh, 400);
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);

    // Refresh sur tout changement de hauteur du document.
    const ro = new ResizeObserver(scheduleRefresh);
    ro.observe(document.body);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('load', refresh);
      ro.disconnect();
    };
  }, []);

  return null;
}
