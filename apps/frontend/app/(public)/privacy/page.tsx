import type { Metadata } from 'next';
import { LegalDoc } from '@/components/customs/public/legal/legal-doc';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Flash Menu',
  description:
    "Comment Flash Menu collecte, utilise et protège vos données personnelles, en conformité avec le RGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Confidentialité"
      title={<>Politique de <span className="font-display-italic text-gradient-warm">confidentialité</span></>}
      updatedAt="11 juillet 2026"
      intro="Votre confiance est notre priorité. Ce document explique quelles données nous collectons, pourquoi, et les droits dont vous disposez, en conformité avec le RGPD."
      sections={[
        {
          heading: "Données que nous collectons",
          body: (
            <>
              <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Compte</strong> : nom, email, mot de passe chiffré, rôle.</li>
                <li><strong>Établissement</strong> : nom du restaurant, adresse, menu, tables.</li>
                <li><strong>Activité</strong> : commandes, réservations, transactions de caisse.</li>
                <li><strong>Technique</strong> : logs de connexion, type d&apos;appareil, données d&apos;usage anonymisées.</li>
              </ul>
            </>
          ),
        },
        {
          heading: "Finalités du traitement",
          body: (
            <p>
              Vos données servent à fournir et sécuriser le service, gérer votre abonnement,
              vous fournir un support, et améliorer la plateforme via des statistiques agrégées.
              Nous ne vendons jamais vos données à des tiers.
            </p>
          ),
        },
        {
          heading: "Base légale",
          body: (
            <p>
              Le traitement repose sur l&apos;exécution du contrat (fourniture du service), votre
              consentement (communications marketing), et notre intérêt légitime (sécurité,
              amélioration du produit).
            </p>
          ),
        },
        {
          heading: "Hébergement & sécurité",
          body: (
            <p>
              Vos données sont hébergées dans l&apos;Union européenne. Elles sont chiffrées en
              transit (TLS 1.3) et au repos (AES-256), et protégées par des contrôles
              d&apos;accès stricts ainsi qu&apos;un journal d&apos;audit.
            </p>
          ),
        },
        {
          heading: "Durée de conservation",
          body: (
            <p>
              Les données de compte sont conservées tant que votre abonnement est actif, puis
              supprimées ou anonymisées dans un délai de 12 mois après résiliation, sauf
              obligation légale de conservation (facturation, comptabilité).
            </p>
          ),
        },
        {
          heading: "Vos droits",
          body: (
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
              portabilité et d&apos;opposition. Pour les exercer, écrivez à{' '}
              <a href="mailto:privacy@flashmenu.app">privacy@flashmenu.app</a>. Vous pouvez
              également introduire une réclamation auprès de la CNIL.
            </p>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              Nous utilisons des cookies strictement nécessaires au fonctionnement et, avec votre
              consentement, des cookies de mesure d&apos;audience anonymisée. Vous pouvez gérer
              vos préférences à tout moment depuis votre navigateur.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Pour toute question relative à vos données, contactez notre délégué à la protection
              des données à <a href="mailto:privacy@flashmenu.app">privacy@flashmenu.app</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
