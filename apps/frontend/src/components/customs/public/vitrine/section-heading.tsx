import type { ReactNode } from "react"
import { Reveal } from "@/components/motion/reveal"
import { TextReveal } from "@/components/motion/text-reveal"

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: "center" | "left"
  className?: string
}

/**
 * En-tête de section éditorial partagé : petit filet + eyebrow en capitales,
 * titre serif (Fraunces) révélé au scroll, sous-titre optionnel. Garantit un
 * rythme typographique cohérent sur toute la vitrine.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const isCenter = align === "center"
  return (
    <div
      className={`${isCenter ? "mx-auto text-center items-center" : "items-start text-left"} flex flex-col max-w-2xl ${className}`}
    >
      <Reveal as="div" y={12} className="inline-flex items-center gap-2.5 mb-5">
        <span className="h-px w-8 bg-primary/60" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
      </Reveal>

      <TextReveal
        as="h2"
        className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] lg:leading-[1.05] text-foreground text-balance"
      >
        {title}
      </TextReveal>

      {description && (
        <Reveal as="p" delay={0.12} className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {description}
        </Reveal>
      )}
    </div>
  )
}
