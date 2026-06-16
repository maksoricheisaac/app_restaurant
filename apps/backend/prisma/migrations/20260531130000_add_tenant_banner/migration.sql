-- Add logo blob pathname + banner image fields to Tenant
-- logoPathname: allows proper Blob cleanup when logo is replaced/deleted
-- bannerUrl + bannerPathname: restaurant banner image (hero section on public menu)

ALTER TABLE "Tenant" ADD COLUMN "logoPathname"   TEXT;
ALTER TABLE "Tenant" ADD COLUMN "bannerUrl"       TEXT;
ALTER TABLE "Tenant" ADD COLUMN "bannerPathname"  TEXT;
