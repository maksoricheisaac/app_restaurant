/* eslint-disable react/no-unescaped-entities */
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone } from "lucide-react"
import Link from "next/link"

export const ContactInfo = () => {
    return (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Besoin d'aide ?
                </h3>
                <p className="text-gray-600 mb-6">
                    Notre équipe est à votre disposition pour toute question concernant votre commande
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        variant="outline"
                        className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                    >
                        <Link href="tel:+24206123456">
                            <Phone className="h-4 w-4 mr-2" />
                            +242 06 123 45 67
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                    >
                        <Link href="mailto:contact@saveursdafrique.cg">
                            <Mail className="h-4 w-4 mr-2" />
                            Nous écrire
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}