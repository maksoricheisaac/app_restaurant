import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Order, OrderStatus, OrderType } from "@/types/order";
import { CheckCircle, Clock } from "lucide-react";

interface OrderCardProps {
	order: Order;
	onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
	onCancel: (orderId: string) => void;
	onPrintPDF: (order: Order) => void;
	formatCurrency: (amount: number) => string;
	statusColors: Record<OrderStatus, string>;
	statusLabels: Record<OrderStatus, string>;
	typeLabels: Record<OrderType, string>;
	isUpdating: boolean;
}

export function OrderCard({
	order,
	onStatusChange,
	onCancel,
	onPrintPDF,
	formatCurrency,
	statusColors,
	statusLabels,
	typeLabels,
	isUpdating
}: OrderCardProps) {
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [previousStatus, setPreviousStatus] = useState<OrderStatus | null>(null);

	// Détecter quand une commande passe de "pending" à "preparing" (validation)
	useEffect(() => {
		if (previousStatus === "pending" && order.status === "preparing") {
			setShowConfirmation(true);
			// Masquer la confirmation après 5 secondes
			const timer = setTimeout(() => {
				setShowConfirmation(false);
			}, 5000);
			return () => clearTimeout(timer);
		}
		setPreviousStatus(order.status);
	}, [order.status, previousStatus]);

	// Vérifier si la commande peut être annulée (pas prête ni terminée)
	const canCancel = order.status !== "served" && order.status !== "cancelled";
	const canPrint = order.status === "ready" || order.status === "served";

	// Si la confirmation est affichée, montrer le message de confirmation
	if (showConfirmation) {
		return (
			<Card className="relative border-2 border-green-200 shadow-lg bg-green-50/50 h-full flex flex-col">
				<CardContent className="p-6 flex-1 flex flex-col">
					<div className="text-center space-y-4 flex-1 flex flex-col justify-center">
						<div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
							<CheckCircle className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-green-800 mb-2">
								Commande #{order.id.slice(-6).toUpperCase()} validée !
							</h3>
							<p className="text-green-700 mb-4">
								Votre commande a été confirmée et est maintenant en préparation.
							</p>
							<div className="bg-white rounded-lg p-4 border border-green-200">
								<div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-2">
									<Clock className="w-4 h-4" />
									<span className="font-medium">Suivez l&apos;état de votre commande</span>
								</div>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-green-500 rounded-full"></div>
										<span className="text-sm text-gray-600">Commande confirmée</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-orange-400 rounded-full"></div>
										<span className="text-sm text-gray-600">En préparation</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-1 h-1 bg-blue-400 rounded-full"></div>
										<span className="text-sm text-gray-600">Prête à récupérer</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex gap-2 mt-auto">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowConfirmation(false)}
								className="flex-1"
							>
								Fermer
							</Button>
							<Button
								size="sm"
								onClick={() => onPrintPDF(order)}
								className="flex-1 bg-green-600 hover:bg-green-700"
							>
								Imprimer le ticket
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="relative border-2 border-orange-100 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
			<CardHeader className="pb-2 flex flex-row items-center justify-between">
				<div>
					<CardTitle className="text-base font-bold text-orange-700 flex items-center gap-2">
						<span>Commande #{order.id.slice(-6).toUpperCase()}</span>
					</CardTitle>
					<div className="flex items-center gap-2 mt-1">
						<Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
						<span className="text-xs text-gray-500">{typeLabels[order.type]}</span>
					</div>
				</div>
				<div className="text-right">
					<div className="text-lg font-bold text-orange-600">{formatCurrency(order.total || 0)}</div>
					<div className="text-xs text-gray-400">{order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''}</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0 flex-1 flex flex-col">
				<div className="flex-1 space-y-2">
					<div>
						<span className="font-semibold text-gray-700">Client :</span> {order.user.name || 'Invité'}
						<div className="text-xs text-gray-500">{order.user.email}</div>
						{order.user.phone && <div className="text-xs text-gray-500">{order.user.phone}</div>}
					</div>
					<div>
						<span className="font-semibold text-gray-700">Table :</span> {order.table ? `Table ${order.table.number}` : '-'}
					</div>
					<div>
						<span className="font-semibold text-gray-700">Date :</span> {format(new Date(order.createdAt), "d MMMM yyyy", { locale: fr })} à {format(new Date(order.createdAt), "HH:mm")}
					</div>
					<div>
						<span className="font-semibold text-gray-700">Articles :</span>
						<ul className="list-disc ml-5 text-sm text-gray-700">
							{order.orderItems.map((item) => (
								<li key={item.id}>{item.quantity}× {item.name} <span className="text-gray-400">({formatCurrency(item.price * item.quantity)})</span></li>
							))}
						</ul>
					</div>
				</div>
				
				{/* Footer avec les actions - toujours en bas */}
				<div className="flex flex-col gap-2 w-full mt-4">
					<div className="flex flex-col md:flex-row gap-2 w-full">
						<Select
							value={order.status}
							onValueChange={(value) => {
								if (order.status !== value) {
									try {
										onStatusChange(order.id, value as OrderStatus);
									} catch (error) {
										console.error('Erreur lors du changement de statut:', error);
									}
								}
							}}
							disabled={isUpdating}
						>
							<SelectTrigger className="w-full flex-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">En attente</SelectItem>
								<SelectItem value="preparing">En préparation</SelectItem>
								<SelectItem value="ready">Prête</SelectItem>
								<SelectItem value="served">Servie</SelectItem>
							</SelectContent>
						</Select>

						<Button
							variant="destructive"
							className="w-full flex-1"
							onClick={() => onCancel(order.id)}
							disabled={!canCancel || isUpdating}
						>
							Annuler
						</Button>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onPrintPDF(order)}
						className="w-full"
						disabled={!canPrint}
					>
						{canPrint ? "Imprimer PDF" : "Impression non disponible"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
} 