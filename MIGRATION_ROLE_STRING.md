# Migration du champ `role` : Enum → String

## 📋 Résumé des modifications

Cette migration convertit le champ `role` du modèle `User` d'un enum Prisma vers un type `String` natif pour assurer la compatibilité avec Better Auth.

## ✅ Fichiers modifiés

### 1. Schema Prisma
- **`prisma/schema.prisma`**
  - ❌ Supprimé : `enum UserRole`
  - ✅ Modifié : `User.role` de `UserRole` → `String @default("user")`
  - ✅ Modifié : `RolePermission.role` de `UserRole` → `String`

### 2. Types TypeScript
- **`src/types/permissions.ts`**
  - ❌ Supprimé : `enum UserRole`
  - ✅ Ajouté : Constantes `USER_ROLES` avec type dérivé
  - ✅ Ajouté : Export des constantes individuelles (ADMIN, OWNER, etc.)
  - ✅ Modifié : Utilisation des constantes dans `ROLE_PERMISSIONS` et `ROLE_LABELS`

### 3. Hooks
- **`src/hooks/usePermissions.ts`**
  - ✅ Modifié : Import et utilisation des nouvelles constantes
  - ✅ Modifié : Fonctions `isAdmin()`, `isManager()`, `isStaff()` utilisent les constantes

### 4. Composants
- **`src/components/customs/admin/settings/personnel-management.tsx`**
  - ✅ Modifié : Import et utilisation des nouvelles constantes dans le tableau `roles`

### 5. Schémas de validation
- **`src/schemas/admin-schemas.ts`**
  - ✅ Ajouté : Constante `VALID_ROLES`
  - ✅ Modifié : Utilisation de `z.enum(VALID_ROLES)` au lieu de valeurs en dur

### 6. Scripts
- **`scripts/init-permissions.ts`**
  - ✅ Modifié : Type explicite pour le tableau `permissions`

## 🔧 Fichiers déjà compatibles (aucune modification nécessaire)

Ces fichiers utilisaient déjà des strings pour les comparaisons de rôles :
- `app/admin/layout.tsx`
- `src/components/admin/dashboard-header.tsx`
- `src/components/admin/dashboard/dashboard-header.tsx`
- `src/actions/admin/settings-actions.ts`
- `src/actions/admin/permissions-actions.ts`

## 📦 Prochaines étapes

### 1. Générer les types Prisma
```bash
pnpm prisma generate
```

### 2. Pousser les changements vers la base de données
```bash
pnpm prisma db push
```

### 3. Vérifier la migration
```bash
# Vérifier que le champ role est maintenant de type text dans PostgreSQL
# Les valeurs existantes doivent être préservées
```

### 4. Réinitialiser les permissions (optionnel)
```bash
pnpm tsx scripts/init-permissions.ts
```

### 5. Tester l'application
```bash
pnpm dev
```

## 🎯 Résultat attendu

- ✅ Le champ `role` est de type `String` dans Prisma
- ✅ Le champ `role` est de type `text` dans PostgreSQL
- ✅ Better Auth fonctionne sans erreur de conversion
- ✅ Les rôles sont gérés via des constantes TypeScript
- ✅ La sécurité de type est maintenue
- ✅ Toutes les fonctionnalités existantes fonctionnent

## 🔍 Valeurs de rôles supportées

```typescript
- "admin"       // Administrateur système
- "owner"       // Propriétaire
- "manager"     // Gérant
- "head_chef"   // Chef cuisinier
- "chef"        // Cuisinier
- "waiter"      // Serveur
- "cashier"     // Caissier
- "user"        // Client (par défaut)
```

## ⚠️ Notes importantes

1. **Compatibilité Better Auth** : Le champ `role` est maintenant un `String` natif, compatible avec Better Auth
2. **Sécurité de type** : Les constantes TypeScript assurent la sécurité de type sans enum Prisma
3. **Validation** : Zod valide les rôles avec `z.enum(VALID_ROLES)`
4. **Permissions** : Le système de permissions continue de fonctionner normalement
5. **Données existantes** : Les valeurs de rôles existantes dans la DB sont préservées

## 🚀 Déploiement

Après avoir testé localement :

```bash
# Commit les changements
git add .
git commit -m "fix(auth): migrate role field from enum to string for Better Auth compatibility"

# Push vers le repository
git push

# Vercel déploiera automatiquement
# Les migrations Prisma seront appliquées automatiquement
```
