# 🔧 Corrections des Erreurs de Build

## ✅ Erreurs Corrigées

### 1. **Erreur TypeScript - OrderItem.menuItemId**

**Erreur** :
```
Type 'string | null' is not assignable to type 'string'.
Type 'null' is not assignable to type 'string'.
```

**Cause** : 
Le schéma Prisma définit `menuItemId` comme `String?` (nullable), mais le type TypeScript le définissait comme `string` (non-nullable).

**Solution** :
Fichier modifié : `src/types/order.ts`

```typescript
// Avant
export interface OrderItem {
  menuItemId: string;  // ❌
}

// Après
export interface OrderItem {
  menuItemId: string | null;  // ✅
}
```

---

### 2. **Erreur d'Import - UserRole non exporté**

**Erreur** :
```
Attempted import error: 'UserRole' is not exported from '@/types/permissions'
```

**Cause** : 
Cache Next.js corrompu après la migration de l'enum vers les constantes.

**Solution** :
Le type `UserRole` est bien exporté dans `src/types/permissions.ts` :

```typescript
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
```

**Action requise** : Nettoyer le cache Next.js

---

## 🧹 Nettoyage du Cache

### Option 1 : Script PowerShell (Recommandé)
```powershell
.\fix-build.ps1
```

### Option 2 : Commandes Manuelles
```bash
# Supprimer le cache Next.js
rm -rf .next

# Supprimer le cache node_modules
rm -rf node_modules/.cache

# Régénérer Prisma
pnpm prisma generate

# Redémarrer le serveur
pnpm dev
```

### Option 3 : Nettoyage Complet
```bash
# Si les erreurs persistent
rm -rf .next node_modules/.cache
pnpm install
pnpm prisma generate
pnpm dev
```

---

## 📝 Fichiers Modifiés

1. ✅ `src/types/order.ts` - Correction du type `OrderItem.menuItemId`
2. ✅ `fix-build.ps1` - Script de nettoyage créé

---

## 🎯 Prochaines Étapes

1. **Exécuter le script de nettoyage** :
   ```powershell
   .\fix-build.ps1
   ```

2. **Redémarrer le serveur** :
   ```bash
   pnpm dev
   ```

3. **Vérifier que tout fonctionne** :
   - Page order-tracking : `/order-tracking`
   - Page personnel : `/admin/settings`

---

## 🔍 Vérification des Types

### UserRole (src/types/permissions.ts)
```typescript
// ✅ Correctement exporté
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Valeurs possibles
type UserRole = "admin" | "owner" | "manager" | "head_chef" | "chef" | "waiter" | "cashier" | "user"
```

### OrderItem (src/types/order.ts)
```typescript
// ✅ Correctement typé
export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;  // ✅ Nullable
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
}
```

---

## ⚠️ Notes Importantes

1. **Cache Next.js** : Toujours nettoyer le cache après des modifications de types
2. **Prisma Generate** : Exécuter après chaque modification du schema
3. **TypeScript** : Vérifier que les types correspondent aux données Prisma

---

## 🚀 Commandes Utiles

```bash
# Nettoyer et rebuild
pnpm clean && pnpm build

# Vérifier les types TypeScript
pnpm tsc --noEmit

# Linter
pnpm lint

# Formater le code
pnpm format
```

---

## ✨ Résultat Attendu

Après avoir exécuté le script de nettoyage et redémarré le serveur :

- ✅ Aucune erreur de build
- ✅ Types correctement importés
- ✅ Page order-tracking fonctionnelle
- ✅ Page personnel fonctionnelle
- ✅ Tous les imports de `UserRole` fonctionnent
