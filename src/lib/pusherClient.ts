// lib/pusherClient.ts
import Pusher from 'pusher-js';

// Vérification des variables d'environnement
const requiredEnvVars = {
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
};

// Vérifier que toutes les variables sont définies
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn('⚠️ Variables d\'environnement Pusher client manquantes:', missingVars);
  console.warn('Les notifications en temps réel ne fonctionneront pas correctement.');
}

export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});
