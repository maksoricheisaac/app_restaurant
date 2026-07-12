import type { Metadata } from 'next';
import { LegalDoc } from '@/components/customs/public/legal/legal-doc';

export const metadata: Metadata = {
  title: 'Mentions légales — Flash Menu',
  description: "Mentions légales et informations sur l'éditeur du service Flash Menu.",
};

// Les identifiants propres à la société (raison sociale, SIREN, capital, adresse)
// sont volontairement laissés en [À compléter] : ce sont des données officielles
// qui ne doivent pas être inventées et doivent être renseignées par l'éditeur.
export default function LegalPage() {
  return (
    <LegalDoc
      eyebrow="Informations légales"
      title={<>Mentions <span className="font-display-italic text-gradient-warm">légales</span></>}
      updatedAt="11 juillet 2026"
      intro="Conformément à la loi pour la confiance dans l'économie numérique (LCEN), voici les informations relatives à l'éditeur et à l'hébergeur du service Flash Menu."
      sections={[
        {
          heading: "Éditeur du site",
          body: (
            <>
              <p>
                Le service Flash Menu est édité par <strong>[À compléter — raison sociale]</strong>,
                société au capital de <strong>[À compléter]</strong>, immatriculée au RCS de
                <strong> [À compléter]</strong> sous le numéro <strong>[SIREN à compléter]</strong>.
              </p>
              <p>
                Siège social : <strong>[Adresse à compléter]</strong>.<br />
                Directeur de la publication : <strong>[À compléter]</strong>.<br />
                Contact : <a href="mailto:hello@flashmenu.app">hello@flashmenu.app</a>.
              </p>
            </>
          ),
        },
        {
          heading: "Hébergement",
          body: (
            <p>
              Le service est hébergé au sein de l&apos;Union européenne par des prestataires
              d&apos;infrastructure cloud certifiés. Les coordonnées exactes de l&apos;hébergeur
              sont disponibles sur simple demande à <a href="mailto:hello@flashmenu.app">hello@flashmenu.app</a>.
            </p>
          ),
        },
        {
          heading: "Propriété intellectuelle",
          body: (
            <p>
              L&apos;ensemble des éléments du site (marque « Flash Menu », logo, interface,
              textes, illustrations, code) est protégé par le droit de la propriété
              intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans
              autorisation écrite préalable est interdite.
            </p>
          ),
        },
        {
          heading: "Responsabilité",
          body: (
            <p>
              Flash Menu s&apos;efforce d&apos;assurer l&apos;exactitude des informations
              diffusées et la disponibilité du service, sans toutefois garantir l&apos;absence
              d&apos;interruption ou d&apos;erreur. L&apos;éditeur ne saurait être tenu
              responsable des dommages indirects résultant de l&apos;utilisation du service.
            </p>
          ),
        },
        {
          heading: "Données personnelles",
          body: (
            <p>
              Le traitement des données personnelles est détaillé dans notre{' '}
              <a href="/privacy">Politique de confidentialité</a>. Vous disposez d&apos;un droit
              d&apos;accès, de rectification et de suppression de vos données, exerçable à
              l&apos;adresse <a href="mailto:privacy@flashmenu.app">privacy@flashmenu.app</a>.
            </p>
          ),
        },
        {
          heading: "Droit applicable",
          body: (
            <p>
              Les présentes mentions sont régies par le droit français. Tout litige relatif à
              leur interprétation ou à leur exécution relève des tribunaux compétents.
            </p>
          ),
        },
      ]}
    />
  );
}
