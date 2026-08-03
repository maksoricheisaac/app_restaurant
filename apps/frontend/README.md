# Flash Menu — Interface

Application Next.js 16 (App Router, React 19). Elle sert trois publics
distincts dans un même déploiement :

| Public | Routes | Authentification |
|---|---|---|
| Clients du restaurant | `/`, `/menu`, `/menu/order`, `/menu/reservation`, `/menu/track/:orderId`, `/about`, `/contact` | aucune |
| Équipe | `/admin/*` | cookie de session |
| Première installation | `/setup` | aucune — n'aboutit qu'une fois |

---

## Démarrer

```bash
pnpm install
pnpm dev        # → http://localhost:3000
```

L'API doit tourner en parallèle. En développement local elle écoute sur
**4000** (le frontend, lui, sur 3000 — l'inverse de la configuration Docker).

Partez de `.env.example`. En développement local (backend sur 4000) :

```
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"   # appelé depuis le navigateur
BACKEND_URL="http://localhost:4000/api/v1"           # appelé depuis le serveur (SSR)
NEXT_PUBLIC_WS_URL="http://localhost:4000/ws"        # temps réel
NEXT_PUBLIC_APP_URL="http://localhost:3000"          # utilisé par sitemap.xml / robots.txt
```

> Les valeurs de `.env.example` supposent la configuration Docker
> (backend sur 3000). En local, décalez-les vers 4000.

`NEXT_PUBLIC_API_URL` et `BACKEND_URL` coexistent parce que les Server
Components appellent l'API depuis le serveur, où `localhost` peut désigner un
autre hôte qu'au navigateur — sous Docker, `BACKEND_URL` vaut
`http://backend:3000/api/v1`.

⚠️ Sans `NEXT_PUBLIC_WS_URL`, le temps réel (nouvelles commandes, écran
cuisine, suivi client) **échoue silencieusement** : aucune erreur visible, mais
plus aucune mise à jour en direct.

---

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement, port 3000 |
| `pnpm build` | Build de production |
| `pnpm start` | Sert le build |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Playwright — voir plus bas |
| `pnpm lint:ci` | Lint sans correction automatique |

---

## Structure

```
app/
├── (public)/          site vitrine : accueil, à propos, contact, mentions
├── menu/              carte publique, commande, réservation, suivi
│   ├── _components/   île cliente de l'expérience de commande
│   └── _lib/          types, thème, panier (localStorage)
├── admin/             administration (protégée)
├── auth/              connexion, mot de passe oublié, vérification email
├── invite/accept/     acceptation d'invitation = création du compte
├── setup/             assistant de première installation
└── api/               routes serveur Next (session, upload, health)

src/
├── components/  ui/ (shadcn) · admin_v2/ · customs/ (vitrine, admin, menu)
├── contexts/    AuthContext, CartContext, AdminNotificationContext
├── hooks/api/   hooks React Query, un fichier par domaine
├── services/    appels HTTP, un fichier par domaine
├── lib/         api-client, query-keys, pdf/, seo, monitoring
├── schemas/     validation Zod des formulaires
└── types/       types partagés (restaurant, order, permissions…)
```

**Convention :** un écran n'appelle jamais `fetch` directement. Il passe par un
hook de `hooks/api/`, qui passe par un service de `services/`, qui passe par
`lib/api-client`. Cette chaîne centralise le rafraîchissement de session sur
401 et la corrélation des requêtes (`X-Request-ID`).

---

## Points d'architecture

**Aucun contexte d'établissement.** Il n'y a qu'un restaurant : `api-client`
n'envoie aucun en-tête d'identification, le middleware n'injecte rien, et il
n'existe pas de `TenantContext`. Les URL publiques n'ont pas de slug.

**Le client ne détient aucun droit.** `AuthContext` expose le profil pour
l'affichage ; toute décision d'autorisation est prise par le serveur, qui relit
le rôle en base à chaque requête. Masquer un bouton n'est qu'un confort.

**Le cache est purgé à la déconnexion** (`queryClient.clear()`). Sur une
tablette partagée en salle ou en cuisine, les données d'un employé ne doivent
jamais réapparaître, même brièvement, pour le suivant.

**Le panier vit dans `localStorage`**, sous une clé unique : il survit à la
navigation vers le paiement et au rechargement.

**Temps réel :** `SocketProvider` ouvre une seule connexion Socket.IO. Le
personnel authentifié rejoint le salon côté serveur — rien à émettre. Seul le
suivi public d'une commande demande un `join-order` explicite.

---

## Formulaires et accessibilité

Les formulaires utilisent `react-hook-form` + Zod via les composants
`components/ui/form.tsx` (shadcn).

⚠️ **`FormControl` pose `id` et `aria-describedby` sur son enfant direct**
(Radix `Slot`). Si vous l'enveloppez autour d'un `<div>` décoratif, l'attribut
atterrit sur le div et le `<label for>` ne désigne plus aucun champ : le
formulaire devient muet pour les lecteurs d'écran. Placez le wrapper
**à l'extérieur** :

```tsx
// ✗ le label ne pointe sur rien
<FormControl>
  <div className="relative">
    <Mail /> <Input {...field} />
  </div>
</FormControl>

// ✓
<div className="relative">
  <Mail />
  <FormControl>
    <Input {...field} />
  </FormControl>
</div>
```

---

## Tests

```bash
pnpm test        # 5 suites, 28 tests (Vitest)
```

### End-to-end (Playwright)

Backend et frontend doivent tourner, et la base contenir le jeu de données de
test (`pnpm seed-test` côté backend).

```bash
E2E_API_URL=http://localhost:4000/api/v1 pnpm test:e2e
```

- `E2E_BASE_URL` — frontend, défaut `http://localhost:3000`
- `E2E_API_URL` — API, défaut `http://localhost:3000/api/v1` (valeur juste en
  CI, où le backend écoute sur 3000 ; à surcharger en local)

Quatre projets : `setup` (authentifie le propriétaire une fois),
`admin-chromium` (réutilise cet état), `public-chromium` et `security` (sans
authentification).

Les tests d'API anonymes situés dans `e2e/admin/` déclarent explicitement
`test.use({ storageState: { cookies: [], origins: [] } })`. Sans cela, ils
hériteraient de la session admin et vérifieraient l'inverse de leur intention.

La suite est dense et peut franchir la limite de débit du backend
(30 requêtes/minute, 5 connexions/minute) : en cas de `429` en cascade,
redémarrez le backend — le compteur est en mémoire sans Redis.
