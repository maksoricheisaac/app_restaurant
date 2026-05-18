import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
import {
	User,
	MapPin,
	Clock,
	Printer,
	X,
	StickyNote,
	UtensilsCrossed,
} from "lucide-react";

const STATUS_ACCENT: Record<string, string> = {
	pending:   "border-l-amber-500",
	preparing: "border-l-blue-500",
	ready:     "border-l-indigo-500",
	served:    "border-l-green-500",
	completed: "border-l-emerald-500",
	cancelled: "border-l-red-500",
};

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
	isUpdating,
}: OrderCardProps) {
	const canCancel = order.status !== "served" && order.status !== "cancelled";
	const canPrint  = order.status === "served";
	const accent    = STATUS_ACCENT[order.status] ?? "border-l-border";

	return (
		<Card
			className={cn(
				"relative border border-border border-l-4 shadow-sm hover:shadow-md",
				"transition-all duration-200 h-full flex flex-col",
				accent,
			)}
		>
			{/* Header */}
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<CardTitle className="text-sm font-bold text-foreground">
							#{order.id.slice(-6).toUpperCase()}
						</CardTitle>
						<div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
							<Badge className={cn("text-xs font-medium border", statusColors[order.status])}>
								{statusLabels[order.status]}
							</Badge>
							<span className="text-xs text-muted-foreground">
								{typeLabels[order.type]}
							</span>
						</div>
					</div>
					<div className="text-right flex-shrink-0">
						<p className="text-base font-bold text-primary">
							{formatCurrency(order.total || 0)}
						</p>
						<p className="text-xs text-muted-foreground">
							{order.orderItems.length} article{order.orderItems.length > 1 ? "s" : ""}
						</p>
					</div>
				</div>
			</CardHeader>

			{/* Body */}
			<CardContent className="pt-0 flex-1 flex flex-col gap-3">
				<div className="flex-1 space-y-2.5 text-sm">
					{/* Client */}
					<div className="flex items-start gap-2">
						<User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
						<div className="min-w-0">
							<span className="font-medium text-foreground">
								{order.user?.name || "Invité"}
							</span>
							{order.user?.email && (
								<p className="text-xs text-muted-foreground truncate">{order.user.email}</p>
							)}
							{order.user?.phone && (
								<p className="text-xs text-muted-foreground">{order.user.phone}</p>
							)}
						</div>
					</div>

					{/* Table */}
					<div className="flex items-center gap-2">
						<MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						<span className="text-foreground">
							{order.table ? `Table ${order.table.number}` : "—"}
						</span>
					</div>

					{/* Date */}
					<div className="flex items-center gap-2">
						<Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						<span className="text-foreground">
							{format(new Date(order.createdAt), "d MMM yyyy", { locale: fr })}
							{" à "}
							{format(new Date(order.createdAt), "HH:mm")}
						</span>
					</div>

					{/* Frais de livraison */}
					{order.deliveryFee && order.deliveryFee > 0 && (
						<div className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								Livraison : {formatCurrency(order.deliveryFee)}
							</span>
						</div>
					)}

					{/* Notes */}
					{order.specialNotes && (
						<div className="flex items-start gap-2">
							<StickyNote className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
							<p className="text-xs text-foreground bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1 border-l-2 border-amber-400 flex-1">
								{order.specialNotes}
							</p>
						</div>
					)}

					{/* Articles */}
					<div className="flex items-start gap-2">
						<UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
						<ul className="space-y-0.5 flex-1">
							{order.orderItems.map((item) => (
								<li key={item.id} className="flex justify-between gap-2">
									<span className="text-foreground">
										{item.quantity}× {item.name}
									</span>
									<span className="text-muted-foreground flex-shrink-0">
										{formatCurrency(item.price * item.quantity)}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-col gap-2 pt-3 border-t border-border">
					<div className="flex gap-2">
						<Select
							value={order.status}
							onValueChange={(value) => {
								if (order.status !== value) {
									onStatusChange(order.id, value as OrderStatus);
								}
							}}
							disabled={isUpdating}
						>
							<SelectTrigger className="flex-1 h-8 text-xs">
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
							size="icon"
							className="h-8 w-8 flex-shrink-0"
							onClick={() => onCancel(order.id)}
							disabled={!canCancel || isUpdating}
							title="Annuler la commande"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onPrintPDF(order)}
						className="w-full h-8 text-xs gap-1.5"
						disabled={!canPrint}
					>
						<Printer className="h-3.5 w-3.5" />
						{canPrint ? "Imprimer le ticket" : "Disponible après service"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}