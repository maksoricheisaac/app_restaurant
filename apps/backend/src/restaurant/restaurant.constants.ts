/**
 * Clé primaire de l'unique ligne de la table `Restaurant`.
 *
 * Ce n'est pas une convention : une contrainte CHECK en base impose
 * `id = 'restaurant'`, si bien qu'aucune seconde ligne ne peut exister. Toute
 * lecture de la configuration de l'établissement passe par cette constante.
 */
export const RESTAURANT_ID = 'restaurant';
