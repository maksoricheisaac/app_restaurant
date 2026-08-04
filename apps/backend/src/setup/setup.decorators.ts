import { SetMetadata } from '@nestjs/common';

/**
 * Marque une route accessible tant que le logiciel n'est pas installé.
 *
 * `SetupGuard` ferme l'intégralité de l'API avant la première installation :
 * sans ce marqueur, une route est injoignable tant que l'établissement n'existe
 * pas. Réservé aux routes qui ont un sens sur une base vide — l'état de
 * l'installation et les sondes de supervision.
 */
export const SETUP_EXEMPT_KEY = 'setup:exempt';
export const AllowDuringSetup = () => SetMetadata(SETUP_EXEMPT_KEY, true);

/**
 * Marque une route accessible UNIQUEMENT tant que le logiciel n'est pas
 * installé. Une fois l'installation terminée, `SetupGuard` répond 403 sans
 * jamais atteindre le contrôleur.
 *
 * C'est ce qui rend l'assistant d'installation définitivement inaccessible :
 * le refus est prononcé par le garde, en amont de toute logique métier et de
 * toute écriture en base.
 */
export const SETUP_ONLY_KEY = 'setup:only';
export const OnlyDuringSetup = () => SetMetadata(SETUP_ONLY_KEY, true);
