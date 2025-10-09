# Script PowerShell pour migrer l'Inventaire V2
# Exécuter avec : .\migrate-inventory-v2.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration Inventaire V2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Prisma est installé
Write-Host "Vérification de Prisma..." -ForegroundColor Yellow
if (!(Test-Path "node_modules\.bin\prisma.cmd")) {
    Write-Host "❌ Prisma n'est pas installé. Installation..." -ForegroundColor Red
    npm install
}

Write-Host "✅ Prisma trouvé" -ForegroundColor Green
Write-Host ""

# Afficher l'état actuel des migrations
Write-Host "État actuel des migrations:" -ForegroundColor Yellow
npx prisma migrate status
Write-Host ""

# Demander confirmation
Write-Host "⚠️  ATTENTION ⚠️" -ForegroundColor Red
Write-Host "Cette migration va ajouter les champs 'packSize' et 'category' au modèle Ingredient." -ForegroundColor Yellow
Write-Host "Vos données existantes seront conservées." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer? (O/N)"

if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "❌ Migration annulée" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🚀 Démarrage de la migration..." -ForegroundColor Cyan
Write-Host ""

# Créer la migration
Write-Host "Étape 1/3 : Création de la migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_inventory_v2_fields

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la migration" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "1. Vérifiez que la base de données est accessible" -ForegroundColor White
    Write-Host "2. Vérifiez votre fichier .env" -ForegroundColor White
    Write-Host "3. Consultez MIGRATION_MANUELLE_V2.md pour une migration manuelle" -ForegroundColor White
    exit 1
}

Write-Host "✅ Migration créée" -ForegroundColor Green
Write-Host ""

# Générer les types Prisma
Write-Host "Étape 2/3 : Génération des types TypeScript..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération des types" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Types générés" -ForegroundColor Green
Write-Host ""

# Vérifier le schéma
Write-Host "Étape 3/3 : Vérification du schéma..." -ForegroundColor Yellow
npx prisma validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Avertissement : Le schéma contient des erreurs" -ForegroundColor Yellow
} else {
    Write-Host "✅ Schéma valide" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Migration terminée avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Redémarrer le serveur : npm run dev" -ForegroundColor White
Write-Host "2. Accéder à : http://localhost:3000/admin/inventory-v2" -ForegroundColor White
Write-Host "3. Créer votre premier produit" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- INVENTAIRE_V2_README.md : Documentation complète" -ForegroundColor White
Write-Host "- GUIDE_DEMARRAGE_INVENTAIRE_V2.md : Guide de démarrage" -ForegroundColor White
Write-Host "- CHECKLIST_INVENTAIRE_V2.md : Checklist de mise en production" -ForegroundColor White
Write-Host ""

# Demander si on doit redémarrer le serveur
$restart = Read-Host "Voulez-vous redémarrer le serveur maintenant? (O/N)"

if ($restart -eq 'O' -or $restart -eq 'o') {
    Write-Host ""
    Write-Host "🚀 Démarrage du serveur..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host ""
    Write-Host "N'oubliez pas de redémarrer le serveur avec : npm run dev" -ForegroundColor Yellow
}
