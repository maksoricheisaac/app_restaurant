/**
 * Déclenche `onEnter` une seule fois, quand l'élément entre dans le viewport.
 *
 * On préfère IntersectionObserver à ScrollTrigger pour les révélations : il réagit
 * à la visibilité réelle, sans aucun calcul de position à rafraîchir. Résultat :
 * insensible aux décalages de hauteur (images asynchrones, police variable,
 * sections différées) qui faisaient « rater » certaines révélations, et le
 * contenu n'est jamais bloqué invisible s'il entre à l'écran.
 */
export function observeOnce(
  el: Element,
  onEnter: () => void,
  rootMargin = '0px 0px -12% 0px',
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    onEnter();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onEnter();
          io.disconnect();
          break;
        }
      }
    },
    { rootMargin, threshold: 0.01 },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** true si l'utilisateur a demandé à réduire les animations. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
