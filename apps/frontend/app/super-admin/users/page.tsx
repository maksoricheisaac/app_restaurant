"use client";

import { useState } from "react";
import {
  Users, UserPlus, Shield, ShieldAlert, UserCheck, UserCog,
  Search, MoreVertical, Mail, Loader2, AlertCircle, RefreshCw,
  Fingerprint, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StatsCard } from "@/components/ui/stats-card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { useUpdateUserRole, useUpdateUserStatus } from "@/hooks/api/useSuperAdmin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Role Change Dialog ────────────────────────────────────────────────────────

const PLATFORM_ROLES = [
  { value: "user",        label: "Utilisateur",  desc: "Accès standard (tenant uniquement)",    color: "text-muted-foreground" },
  { value: "support",     label: "Support",      desc: "Lecture seule sur les tenants",          color: "text-blue-600" },
  { value: "super_admin", label: "Super Admin",  desc: "Accès complet à la plateforme",          color: "text-orange-600" },
];

function ChangeRoleDialog({ user, onClose }: { user: any | null; onClose: () => void }) {
  const [role, setRole] = useState(user?.platformRole ?? "user");
  const mutation = useUpdateUserRole();

  const handleSave = () => {
    if (!user) return;
    mutation.mutate(
      { id: user.id, platformRole: role },
      {
        onSuccess: () => {
          toast.success(`Rôle de ${user.name} mis à jour : ${role}`);
          onClose();
        },
        onError: (e: any) => toast.error(e?.message || "Erreur"),
      }
    );
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Modifier le rôle
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* User recap */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs uppercase">
              {user.name?.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Rôle plateforme</Label>
            <div className="grid gap-2">
              {PLATFORM_ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    role === r.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex-shrink-0",
                    role === r.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )} />
                  <div>
                    <p className={cn("text-sm font-semibold", r.color)}>{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Annuler</Button>
          <Button
            onClick={handleSave}
            disabled={role === user.platformRole || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SuperAdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleTarget, setRoleTarget] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: () => api.get("/auth/users"),
  });

  const statusMutation = useUpdateUserStatus();

  const users = usersData || [];
  const filteredUsers = users.filter(
    (user: any) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = () => {
    if (!suspendTarget) return;
    const newStatus = suspendTarget.status === "active" ? "inactive" : "active";
    statusMutation.mutate(
      { id: suspendTarget.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === "inactive"
              ? `Accès de ${suspendTarget.name} suspendu.`
              : `Accès de ${suspendTarget.name} réactivé.`
          );
          setSuspendTarget(null);
        },
        onError: (e: any) => toast.error(e?.message || "Erreur"),
      }
    );
  };

  const roleBadge = (platformRole: string) => {
    if (platformRole === "super_admin")
      return <Badge className="text-[10px] uppercase font-bold px-2.5 py-0.5 tracking-wider bg-orange-600 hover:bg-orange-700 text-white">Super Admin</Badge>;
    if (platformRole === "support")
      return <Badge className="text-[10px] uppercase font-bold px-2.5 py-0.5 tracking-wider bg-blue-600 hover:bg-blue-700 text-white">Support</Badge>;
    return <Badge className="text-[10px] uppercase font-bold px-2.5 py-0.5 tracking-wider bg-muted text-muted-foreground">Utilisateur</Badge>;
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" />
            Contrôle des identités et accès globaux.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Utilisateurs"
          value={users.length}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          subtitle="Comptes enregistrés"
        />
        <StatsCard
          title="Super Admins"
          value={users.filter((u: any) => u.platformRole === "super_admin").length}
          icon={<ShieldAlert className="h-5 w-5" />}
          variant="orange"
          subtitle="Accès total plateforme"
        />
        <StatsCard
          title="Actifs"
          value={users.filter((u: any) => u.status !== "inactive").length}
          icon={<UserCheck className="h-5 w-5" />}
          variant="emerald"
          subtitle="Comptes non suspendus"
        />
      </div>

      {/* Table card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">
              Base Utilisateurs
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredUsers.length} résultat{filteredUsers.length !== 1 ? "s" : ""})
              </span>
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, email...)"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
              <p className="text-muted-foreground font-medium animate-pulse">
                Chargement de la base...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="font-semibold">Aucun résultat</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez une autre recherche.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Identité</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Rôle</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center hidden md:table-cell">Statut</TableHead>
                  <TableHead className="py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center hidden lg:table-cell">Inscrit le</TableHead>
                  <TableHead className="py-3 pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => {
                  const isInactive = user.status === "inactive";
                  return (
                    <TableRow key={user.id} className={cn("group", isInactive && "opacity-60")}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground uppercase text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {user.name?.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {roleBadge(user.platformRole || "user")}
                      </TableCell>
                      <TableCell className="text-center py-4 hidden md:table-cell">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border",
                          isInactive
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", isInactive ? "bg-slate-400" : "bg-emerald-500")} />
                          {isInactive ? "Suspendu" : "Actif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4 hidden lg:table-cell">
                        <p className="text-sm font-medium">
                          {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          ID: {user.id.substring(0, 8)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => window.open(`mailto:${user.email}`, "_blank")}
                            >
                              <Mail className="h-4 w-4 text-blue-500" />
                              Contacter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => setRoleTarget(user)}
                            >
                              <UserCog className="h-4 w-4 text-violet-500" />
                              Modifier le rôle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={cn(
                                "gap-2 cursor-pointer",
                                isInactive
                                  ? "text-emerald-600 focus:text-emerald-600"
                                  : "text-destructive focus:text-destructive"
                              )}
                              onClick={() => setSuspendTarget(user)}
                            >
                              <Shield className="h-4 w-4" />
                              {isInactive ? "Réactiver l'accès" : "Suspendre l'accès"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ChangeRoleDialog user={roleTarget} onClose={() => setRoleTarget(null)} />

      <ConfirmationDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={statusMutation.isPending}
        variant={suspendTarget?.status === "active" ? "destructive" : "default"}
        title={suspendTarget?.status === "active" ? "Suspendre l'accès" : "Réactiver l'accès"}
        description={
          suspendTarget?.status === "active"
            ? `Voulez-vous suspendre l'accès de ${suspendTarget?.name} ? Le compte sera désactivé.`
            : `Voulez-vous réactiver l'accès de ${suspendTarget?.name} ?`
        }
        confirmText={suspendTarget?.status === "active" ? "Suspendre" : "Réactiver"}
      />
    </div>
  );
}
