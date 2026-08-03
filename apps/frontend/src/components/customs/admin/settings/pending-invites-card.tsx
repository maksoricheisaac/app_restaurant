"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Send, X, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  usePendingInvites,
  useInviteByEmail,
  useRevokeInvite,
  useResendInvite,
} from "@/hooks/api/useStaff";
import { ROLE_LABELS, MANAGER, CHEF, WAITER, CASHIER } from "@/types/permissions";

const INVITABLE_ROLES = [MANAGER, CHEF, WAITER, CASHIER];

export function PendingInvitesCard() {
  const { data: invites, isLoading } = usePendingInvites();
  const inviteByEmail = useInviteByEmail();
  const revokeInvite = useRevokeInvite();
  const resendInvite = useResendInvite();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(WAITER);

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }
    inviteByEmail.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success(`Invitation envoyée à ${email}`);
          setDialogOpen(false);
          setEmail("");
          setRole(WAITER);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitations en attente
          </CardTitle>
          <CardDescription>
            Invitez une personne qui n&apos;a pas encore de compte Flash Menu — elle reçoit un
            email avec un lien pour créer son compte et rejoindre l&apos;équipe.
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Send className="w-4 h-4" />
              Inviter par email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau membre</DialogTitle>
              <DialogDescription>
                Un email avec un lien d&apos;acceptation (valable 7 jours) sera envoyé.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employe@exemple.com"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInvite} disabled={inviteByEmail.isPending}>
                {inviteByEmail.isPending ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : !invites || invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune invitation en attente.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{(ROLE_LABELS as Record<string, string>)[invite.role] ?? invite.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(invite.expiresAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Renvoyer l'invitation"
                        disabled={resendInvite.isPending}
                        onClick={() =>
                          resendInvite.mutate(invite.id, {
                            onSuccess: () => toast.success("Invitation renvoyée"),
                          })
                        }
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Révoquer l'invitation"
                        disabled={revokeInvite.isPending}
                        onClick={() =>
                          revokeInvite.mutate(invite.id, {
                            onSuccess: () => toast.success("Invitation révoquée"),
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
