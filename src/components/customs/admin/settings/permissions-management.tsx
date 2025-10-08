"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserRole, 
  Permission, 
  ROLE_PERMISSIONS, 
  ROLE_LABELS, 
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES 
} from '@/types/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Users, 
  Shield, 
  Settings, 
  Search,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllUsersWithPermissions, 
  getUserPermissions, 
  updateUserPermissions
} from '@/actions/admin/permissions-actions';

export function PermissionsManagement() {
  const { hasPermission } = usePermissions();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customPermissions, setCustomPermissions] = useState<{ permission: Permission; granted: boolean }[]>([]);
  const queryClient = useQueryClient();

  // Charger les utilisateurs
  const { data: users = [] } = useQuery({
    queryKey: ['users-with-permissions'],
    queryFn: getAllUsersWithPermissions,
  });

  // Charger les permissions d'un utilisateur spécifique
  const { data: userPermissionsData } = useQuery({
    queryKey: ['user-permissions', selectedUser],
    queryFn: () => selectedUser ? getUserPermissions(selectedUser) : null,
    enabled: !!selectedUser,
  });

  // Mutation pour initialiser les permissions par défaut (non utilisée pour l'instant)
  // const initPermissionsMutation = useMutation({
  //   mutationFn: initializeDefaultPermissions,
  //   onSuccess: () => {
  //     toast.success('Permissions par défaut initialisées avec succès');
  //     queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
  //   },
  //   onError: (error: Error) => {
  //     toast.error(error.message);
  //   },
  // });

  // Mutation pour mettre à jour les permissions utilisateur
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: { permission: Permission; granted: boolean }[] }) =>
      updateUserPermissions(userId, permissions),
    onSuccess: () => {
      toast.success('Permissions mises à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', selectedUser] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mettre à jour les permissions personnalisées quand l'utilisateur change
  useEffect(() => {
    if (userPermissionsData) {
      setCustomPermissions(userPermissionsData.customPermissions);
    }
  }, [userPermissionsData]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(user => user.id === selectedUser);
  const userRolePermissions = selectedUserData ? ROLE_PERMISSIONS[selectedUserData.role] : [];

  const handlePermissionToggle = (permission: Permission) => {
    setCustomPermissions(prev => {
      const existing = prev.find(p => p.permission === permission);
      if (existing) {
        return prev.filter(p => p.permission !== permission);
      } else {
        return [...prev, { permission, granted: true }];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUserData) return;

    updatePermissionsMutation.mutate({
      userId: selectedUserData.id,
      permissions: customPermissions,
    });
  };

  const handleResetPermissions = () => {
    setCustomPermissions([]);
    toast.info('Permissions réinitialisées');
  };

  if (!hasPermission(Permission.MANAGE_PERMISSIONS)) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Vous n&apos;avez pas les permissions nécessaires pour gérer les permissions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Permissions
          </CardTitle>
          <CardDescription>
            Gérez les permissions individuelles des utilisateurs et les rôles par défaut
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Permissions Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rôles par Défaut
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Individuelles</CardTitle>
              <CardDescription>
                Accordez ou retirez des permissions spécifiques aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche d'utilisateur */}
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher un utilisateur</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sélection d'utilisateur */}
              <div className="space-y-2">
                <Label htmlFor="user-select">Sélectionner un utilisateur</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un utilisateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{user.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUserData && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUserData.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedUserData.email} • {ROLE_LABELS[selectedUserData.role]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetPermissions}
                        disabled={updatePermissionsMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                      <Button
                        onClick={handleSavePermissions}
                        disabled={updatePermissionsMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>
                  </div>

                  {/* Permissions par catégorie */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Permissions Personnalisées</h4>
                    <div className="text-sm text-muted-foreground">
                      Les permissions cochées s&apos;ajoutent aux permissions du rôle par défaut.
                    </div>
                    
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                      <Card key={category} className="p-4">
                        <h5 className="font-medium mb-3">{category}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map((permission) => {
                            const hasRolePermission = userRolePermissions.includes(permission);
                            const hasCustomPermission = customPermissions.some(cp => cp.permission === permission);
                            
                            return (
                              <div key={permission} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission}
                                  checked={hasCustomPermission}
                                  onCheckedChange={() => handlePermissionToggle(permission)}
                                  disabled={hasRolePermission}
                                />
                                <Label 
                                  htmlFor={permission}
                                  className={`text-sm ${hasRolePermission ? 'text-muted-foreground' : ''}`}
                                >
                                  {PERMISSION_LABELS[permission]}
                                  {hasRolePermission && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Rôle
                                    </Badge>
                                  )}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions par Rôle</CardTitle>
              <CardDescription>
                Consultez les permissions par défaut pour chaque rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                  <Card key={role} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {ROLE_LABELS[role as UserRole]}
                      </h3>
                      <Badge variant="outline">
                        {permissions.length} permissions
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPermissions]) => {
                        const roleHasPermissions = categoryPermissions.some(p => permissions.includes(p));
                        
                        if (!roleHasPermissions) return null;
                        
                        return (
                          <div key={category}>
                            <h4 className="font-medium text-sm mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {categoryPermissions
                                .filter(p => permissions.includes(p))
                                .map(permission => (
                                  <Badge key={permission} variant="secondary" className="text-xs">
                                    {PERMISSION_LABELS[permission]}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
