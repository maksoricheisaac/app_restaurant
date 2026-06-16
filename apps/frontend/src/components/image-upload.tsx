import { AlertCircleIcon, ImageUpIcon, Loader2Icon, XIcon } from "lucide-react"
import Image from "next/image"

import { useFileUpload } from "@/hooks/use-file-upload"

interface ImageUploadProps {
  onImageUpload?: (file: File) => void;
  onImageRemove?: () => void;
  currentImageUrl?: string | null;
  isUploading?: boolean;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageUpload,
  onImageRemove,
  currentImageUrl,
  isUploading = false,
  disabled = false,
}: ImageUploadProps = {}) {
  const maxSizeMB = 5
  const maxSize = maxSizeMB * 1024 * 1024

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/jpeg,image/png,image/webp",
    maxSize,
    onFilesAdded: (addedFiles) => {
      if (addedFiles.length > 0 && onImageUpload) {
        const file = addedFiles[0].file as File;
        onImageUpload(file);
      }
    },
  })

  const previewUrl = files[0]?.preview || currentImageUrl || null
  const isDisabled = disabled || isUploading

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div
          role="button"
          onClick={isDisabled ? undefined : openFileDialog}
          onDragEnter={isDisabled ? undefined : handleDragEnter}
          onDragLeave={isDisabled ? undefined : handleDragLeave}
          onDragOver={isDisabled ? undefined : handleDragOver}
          onDrop={isDisabled ? undefined : handleDrop}
          data-dragging={isDragging || undefined}
          data-disabled={isDisabled || undefined}
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-60 has-[img]:border-none has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload file"
            disabled={isDisabled}
          />

          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2Icon className="size-8 animate-spin" />
                <span className="text-sm font-medium">Envoi en cours…</span>
              </div>
            </div>
          )}

          {previewUrl ? (
            <div className="absolute inset-0">
              <Image
                width={400}
                height={300}
                src={previewUrl}
                alt={files[0]?.file?.name || "Image uploadée"}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageUpIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">
                Glissez votre image ici ou cliquez pour parcourir
              </p>
              <p className="text-muted-foreground text-xs">
                JPEG, PNG, WebP — max {maxSizeMB} Mo
              </p>
            </div>
          )}
        </div>

        {previewUrl && !isUploading && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                if (files[0]?.id) removeFile(files[0].id);
                onImageRemove?.();
              }}
              aria-label="Supprimer l'image"
              disabled={isDisabled}
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  )
}
