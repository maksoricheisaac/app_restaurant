"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Filter, 
  Download,
  DollarSign,
  User
} from "lucide-react";
import { PaymentMethod, TransactionType } from "@/types/order";
import { getTransactions, exportTransactionsCSV } from "@/actions/admin/cash-register-actions";

interface TransactionsTableProps {
  formatCurrency: (amount: number) => string;
}

export function TransactionsTable({ formatCurrency }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    paymentMethod: "",
    transactionType: "",
    dateFrom: "",
    dateTo: "",
  });
  const [exporting, setExporting] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const result = await getTransactions({        
          page: currentPage,
          limit: 20,
          paymentMethod: filters.paymentMethod as PaymentMethod || undefined,
          transactionType: filters.transactionType as TransactionType || undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        
      });

      setTransactions(result.data?.transactions || []);
      setTotalPages(result.data?.totalPages || 1);
      setTotal(result.data?.total || 0);
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filters]);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-green-100 text-green-800";
      case "refund":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Vente";
      case "refund":
        return "Remboursement";
      case "adjustment":
        return "Ajustement";
      default:
        return type;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return "Espèces";
  };

  const getPaymentMethodIcon = (_method: string) => {
    return <DollarSign className="w-4 h-4" />;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      paymentMethod: "",
      transactionType: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await exportTransactionsCSV({
        page: 1,
        limit: 1000,
        paymentMethod: filters.paymentMethod as PaymentMethod || undefined,
        transactionType: filters.transactionType as TransactionType || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      });

      const filename = result.data?.filename || `transactions_${Date.now()}.csv`;
      const csv = result.data?.csv || "";

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Méthode de paiement</label>
              <Select
                value={filters.paymentMethod || undefined}
                onValueChange={(value) => handleFilterChange("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Type de transaction</label>
              <Select
                value={filters.transactionType || undefined}
                onValueChange={(value) => handleFilterChange("transactionType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Vente</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Effacer les filtres
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleExport} disabled={exporting}>
              <Download className="w-4 h-4" />
              {exporting ? "Export..." : "Exporter CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions ({total})</span>
            <div className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Chargement des transactions...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(transaction.createdAt), "dd/MM/yyyy", { locale: fr })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transaction.createdAt), "HH:mm", { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.type)}>
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${
                          transaction.type === "sale" ? "text-green-600" : 
                          transaction.type === "refund" ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {transaction.type === "refund" ? "-" : ""}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(transaction.method)}
                          <span className="text-sm">
                            {getPaymentMethodLabel(transaction.method)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{transaction.cashier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.order ? (
                          <span className="text-sm font-mono">
                            #{transaction.order.id.slice(-6).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {transaction.description || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 