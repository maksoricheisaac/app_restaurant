# Script PowerShell pour nettoyer le cache et rebuild

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Yellow

# Supprimer le dossier .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Dossier .next supprimé" -ForegroundColor Green
}

# Supprimer le cache node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cache node_modules supprimé" -ForegroundColor Green
}

# Régénérer Prisma Client
Write-Host "`n🔄 Régénération du client Prisma..." -ForegroundColor Yellow
pnpm prisma generate

Write-Host "`n✨ Nettoyage terminé!" -ForegroundColor Green
Write-Host "`n🚀 Vous pouvez maintenant lancer: pnpm dev" -ForegroundColor Cyan
