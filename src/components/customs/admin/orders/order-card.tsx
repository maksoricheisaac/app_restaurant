import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
	// Vérifier si la commande peut être annulée (pas prête ni terminée)
	const canCancel = order.status !== "served" && order.status !== "cancelled";
	const canPrint = order.status === "served";


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
						{canPrint ? "Imprimer le ticket" : "Impression disponible après service"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
} 