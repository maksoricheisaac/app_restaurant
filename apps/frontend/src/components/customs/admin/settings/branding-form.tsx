"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Store, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useUploadTenantLogo,
  useDeleteTenantLogo,
  useUploadTenantBanner,
  useDeleteTenantBanner,
} from "@/hooks/api/useMedia";
import api from "@/lib/api-client";

interface TenantBranding {
  logo:      string | null;
  bannerUrl: string | null;
}

function useBranding() {
  return useQuery<TenantBranding>({
    queryKey: ["tenant-me"],
    queryFn:  () => api.get("/tenants/me") as Promise<TenantBranding>,
    staleTime: 60_000,
  });
}

// ─── Image upload zone ────────────────────────────────────────────────────────

function ImageUploadZone({
  label,
  description,
  currentUrl,
  aspectClass,
  onUpload,
  onDelete,
  isUploading,
  isDeleting,
  placeholder,
}: {
  label:        string;
  description:  string;
  currentUrl:   string | null;
  aspectClass:  string;
  onUpload:     (file: File) => void;
  onDelete:     () => void;
  isUploading:  boolean;
  isDeleting:   boolean;
  placeholder:  React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Format invalide. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo).");
      return;
    }
    onUpload(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 gap-1.5"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Supprimer
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={`relative ${aspectClass} rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${
          dragOver
            ? "border-orange-400 bg-orange-50"
            : "border-dashed border-slate-200 hover:border-orange-300 hover:bg-orange-50/30"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {/* Current image */}
        {currentUrl && (
          <img
            src={currentUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay when loading */}
        {(isUploading || isDeleting) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}

        {/* Placeholder / upload prompt */}
        {!currentUrl && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            {placeholder}
            <p className="text-xs font-medium">Cliquer ou glisser-déposer</p>
            <p className="text-[10px]">JPG, PNG, WebP · max 5 Mo</p>
          </div>
        )}

        {/* Replace overlay on hover when image exists */}
        {currentUrl && !isUploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1.5">
              <Upload className="h-6 w-6 text-white" />
              <p className="text-xs font-semibold text-white">Remplacer</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BrandingForm() {
  const { data: tenant, isLoading } = useBranding();

  const uploadLogo   = useUploadTenantLogo();
  const deleteLogo   = useDeleteTenantLogo();
  const uploadBanner = useUploadTenantBanner();
  const deleteBanner = useDeleteTenantBanner();

  async function handleUpload(type: "logo" | "banner", file: File) {
    try {
      if (type === "logo") await uploadLogo.mutateAsync(file);
      else                 await uploadBanner.mutateAsync(file);
      toast.success(type === "logo" ? "Logo mis à jour" : "Bannière mise à jour");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'upload de l'image";
      toast.error(msg, { duration: 8000 });
    }
  }

  async function handleDelete(type: "logo" | "banner") {
    try {
      if (type === "logo") await deleteLogo.mutateAsync();
      else                 await deleteBanner.mutateAsync();
      toast.success(type === "logo" ? "Logo supprimé" : "Bannière supprimée");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
      toast.error(msg, { duration: 6000 });
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité visuelle</CardTitle>
        <CardDescription>
          Le logo et la bannière s'affichent sur la page menu publique de votre restaurant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Logo */}
        <ImageUploadZone
          label="Logo du restaurant"
          description="Affiché dans l'en-tête du menu client et sur vos QR codes. Format carré recommandé (1:1)."
          currentUrl={tenant?.logo ?? null}
          aspectClass="aspect-square max-w-[180px]"
          onUpload={(f) => handleUpload("logo", f)}
          onDelete={() => handleDelete("logo")}
          isUploading={uploadLogo.isPending}
          isDeleting={deleteLogo.isPending}
          placeholder={<Store className="h-10 w-10 text-slate-300" />}
        />

        {/* Banner */}
        <ImageUploadZone
          label="Bannière du menu"
          description="Image hero de votre page menu public. Format paysage recommandé (16:9 ou 3:1). Min. 1200×400 px."
          currentUrl={tenant?.bannerUrl ?? null}
          aspectClass="aspect-[3/1] w-full"
          onUpload={(f) => handleUpload("banner", f)}
          onDelete={() => handleDelete("banner")}
          isUploading={uploadBanner.isPending}
          isDeleting={deleteBanner.isPending}
          placeholder={<ImageIcon className="h-10 w-10 text-slate-300" />}
        />

        <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-xs text-orange-700 space-y-1">
          <p className="font-semibold">Conseils pour un résultat optimal</p>
          <ul className="list-disc list-inside space-y-0.5 text-orange-600">
            <li>Logo : fond transparent (PNG) ou carré 400×400 px minimum</li>
            <li>Bannière : photo en bonne résolution (min. 1200 px de large)</li>
            <li>Évitez les textes sur la bannière, ils sont couverts par le nom du restaurant</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}
