'use client';

/**
 * Point d'entrée unique pour GSAP + plugins.
 *
 * - Enregistre les plugins une seule fois, côté client uniquement (jamais en SSR).
 * - Depuis GSAP 3.13, ScrollTrigger et SplitText sont gratuits (post-rachat Webflow),
 *   donc importables directement depuis le paquet `gsap`.
 * - Toutes les primitives d'animation Flash Menu importent GSAP depuis ce fichier
 *   pour garantir une configuration cohérente.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
