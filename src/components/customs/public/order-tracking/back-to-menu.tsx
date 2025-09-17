import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const BackToMenu = () => {
    return (
        <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-2 border-gray-200 hover:bg-orange-50 hover:border-orange-300">
                <Link href="/menu">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au menu
                </Link>
            </Button>
        </div>
    );
}