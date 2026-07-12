import { ErrorState } from "@/components/customs/public/error-state";

export default function NotFound() {
  return (
    <ErrorState
      icon="compass"
      code="404"
      title="Cette page a quitté la salle"
      message="La page que vous cherchez n'existe pas ou a été déplacée. Revenons en terrain connu."
      primaryHref="/"
      primaryLabel="Retour à l’accueil"
    />
  );
}
