"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, User, Users, Save, RotateCcw, Search } from "lucide-react";
import {
  Permission,
  UserRole,
  ROLE_LABELS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
  ROLE_PERMISSIONS,
  USER_ROLES,
} from "@/types/permissions";
import {
  getAllUsersWithPermissions,
  getUserPermissions,
  updateUserPermissions,
  updateRolePermissions,
} from "@/actions/admin/permissions-actions";

interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  customPermissions: Array<{ permission: Permission; granted: boolean }>;
}

export function AdvancedPermissionsManagement() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<Set<Permission>>(new Set());

  const queryClient = useQueryClient();

  // Récupérer tous les utilisateurs
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-permissions"],
    queryFn: async () => {
      const result = await getAllUsersWithPermissions();
      return result as UserWithPermissions[];
    },
  });

  // Mutation pour mettre à jour les permissions d'un utilisateur
  const updateUserPermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Set<Permission> }) => {
      const permissionsArray = Array.from(permissions).map(p => ({
        permission: p,
        granted: true,
      }));
      return await updateUserPermissions(userId, permissionsArray);
    },
    onSuccess: () => {
      toast.success("Permissions mises à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["users-permissions"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour mettre à jour les permissions d'un rôle
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: Set<Permission> }) => {
      const permissionsArray = Array.from(permissions);
      return await updateRolePermissions(role, permissionsArray);
    },
    onSuccess: () => {
      toast.success("Permissions du rôle mises à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["users-permissions"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Ouvrir le dialog d'édition pour un utilisateur
  const handleEditUser = async (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedRole(null);
    
    // Charger les permissions de l'utilisateur
    const userPerms = await getUserPermissions(user.id);
    const allPerms = new Set([
      ...userPerms.rolePermissions,
      ...userPerms.customPermissions.filter(p => p.granted).map(p => p.permission),
    ]);
    
    setEditingPermissions(allPerms);
    setIsEditDialogOpen(true);
  };

  // Ouvrir le dialog d'édition pour un rôle
  const handleEditRole = (role: UserRole) => {
    setSelectedRole(role);
    setSelectedUser(null);
    
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    setEditingPermissions(new Set(rolePerms));
    setIsEditDialogOpen(true);
  };

  // Toggle une permission
  const togglePermission = (permission: Permission) => {
    setEditingPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return newSet;
    });
  };

  // Sauvegarder les permissions
  const handleSavePermissions = () => {
    if (selectedUser) {
      updateUserPermissionsMutation.mutate({
        userId: selectedUser.id,
        permissions: editingPermissions,
      });
    } else if (selectedRole) {
      updateRolePermissionsMutation.mutate({
        role: selectedRole,
        permissions: editingPermissions,
      });
    }
  };

  // Réinitialiser aux permissions par défaut du rôle
  const handleResetToDefault = () => {
    if (selectedUser) {
      const defaultPerms = ROLE_PERMISSIONS[selectedUser.role] || [];
      setEditingPermissions(new Set(defaultPerms));
    } else if (selectedRole) {
      const defaultPerms = ROLE_PERMISSIONS[selectedRole] || [];
      setEditingPermissions(new Set(defaultPerms));
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ROLE_LABELS[user.role].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestion Avancée des Permissions
              </CardTitle>
              <CardDescription>
                Configurez les permissions pour chaque utilisateur ou rôle
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "roles")}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Par Utilisateur
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Par Rôle
              </TabsTrigger>
            </TabsList>

            {/* Onglet Utilisateurs */}
            <TabsContent value="users" className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Liste des utilisateurs */}
              <div className="space-y-2">
                {isLoadingUsers ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                              <Badge variant="outline">
                                {ROLE_LABELS[user.role]}
                              </Badge>
                              {user.status === "active" ? (
                                <Badge variant="default" className="bg-green-600">Actif</Badge>
                              ) : (
                                <Badge variant="secondary">Inactif</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Gérer les permissions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Rôles */}
            <TabsContent value="roles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(USER_ROLES)
                  .filter(([key]) => !['USER'].includes(key)) // Exclure le rôle USER
                  .map(([, role]) => {
                    const rolePerms = ROLE_PERMISSIONS[role as UserRole] || [];
                    return (
                      <Card key={role} className="hover:bg-accent/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {ROLE_LABELS[role as UserRole]}
                          </CardTitle>
                          <CardDescription>
                            {rolePerms.length} permission(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleEditRole(role as UserRole)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog d'édition des permissions */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedUser
                ? `Permissions de ${selectedUser.name}`
                : selectedRole
                ? `Permissions du rôle ${ROLE_LABELS[selectedRole]}`
                : "Édition des permissions"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{ROLE_LABELS[selectedUser.role]}</Badge>
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
              )}
              Activez ou désactivez les permissions individuellement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Bouton de réinitialisation */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {editingPermissions.size} permission(s) activée(s)
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>

            {/* Permissions par catégorie */}
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="text-xs">
                    {permissions.filter(p => editingPermissions.has(p)).length}/{permissions.length}
                  </Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Label
                        htmlFor={permission}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {PERMISSION_LABELS[permission]}
                      </Label>
                      <Switch
                        id={permission}
                        checked={editingPermissions.has(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updateUserPermissionsMutation.isPending || updateRolePermissionsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateUserPermissionsMutation.isPending || updateRolePermissionsMutation.isPending
                ? "Enregistrement..."
                : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
