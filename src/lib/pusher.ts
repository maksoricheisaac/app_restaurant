// lib/pusher.ts
import Pusher from 'pusher';

// Vérification des variables d'environnement
const requiredEnvVars = {
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
};

// Vérifier que toutes les variables sont définies
const missingVars = Object.entries(requiredEnvVars)
  .filter(([value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn('⚠️ Variables d\'environnement Pusher manquantes:', missingVars);
  console.warn('Les notifications en temps réel ne fonctionneront pas correctement.');
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
