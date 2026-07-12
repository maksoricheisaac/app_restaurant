import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { CartProvider } from "@/contexts/CartContext";
import { QueryProvider } from "./tanstack-query-provider";
import { StructuredData } from "@/components/seo/structured-data";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

// Fraunces — serif éditorial variable (chaleureux, premium) réservé aux grands
// titres. C'est la signature typographique qui distingue Flash Menu des SaaS
// génériques tout-Inter. `opsz`/`SOFT` adoucissent le rendu pour l'hospitalité.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT'],
});

export const metadata: Metadata = {
  title: "Flash Menu - SaaS de Gestion Restaurant",
  description: "Digitalisez votre restaurant avec Flash Menu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <StructuredData type="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flash Menu" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <TenantProvider>
                <CartProvider>
                  <ErrorBoundary>
                  {children}
                  </ErrorBoundary>
                  <Toaster 
                    position="top-right"
                    richColors
                    closeButton
                    duration={4000}
                  />
                </CartProvider>
              </TenantProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
