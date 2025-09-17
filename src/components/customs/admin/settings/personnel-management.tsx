/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  UserPlus,
  Key,
  Mail,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { 
  getPersonnel, 
  addPersonnel, 
  updatePersonnel, 
  deletePersonnel, 
  togglePersonnelStatus,
  getPersonnelStats,
  type Personnel 
} from "@/actions/admin/settings-actions";
import { generateSecurePassword } from "@/utils/passwordUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const roles = [
  { value: "admin", label: "Administrateur", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "manager", label: "Manager", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "waiter", label: "Serveur", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "kitchen", label: "Cuisine", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "cashier", label: "Caissier", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" }
];

const fetchPersonnel = async() => {
  const result = await getPersonnel()

  if(!result) throw new Error("Erreur lors de la récupération des données du personnel !")
  
  return result
}

const fetchPersonnelStats = async () => {
  const result = await getPersonnelStats()

  if(!result) throw new Error("Erreur lors de la récupération des stats du personnel !")
  
  return result

}

export function PersonnelManagement() {


  const [actionLoading, setActionLoading] = useState(false);

  const [newPersonnel, setNewPersonnel] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "waiter" as "admin" | "manager" | "waiter" | "kitchen" | "cashier",
    password: "MotDePasse123!"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const queryClient = useQueryClient()


  // Chargements des données

  const { data : personnel, isLoading : personnelLoading } = useQuery({
    queryKey: ["personnel-data"],
    queryFn: fetchPersonnel
  })

  const { data : stats } = useQuery({
    queryKey: ["stats-data"],
    queryFn: fetchPersonnelStats
  })

  // Mutations des données
  const deletePersonnelMutation = useMutation({
    mutationFn: deletePersonnel,
    onSuccess: () => {
      toast.success("Personnel supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["personnel-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: togglePersonnelStatus,
    onSuccess: () => {
      toast.success("Satus mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["personnel-data"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    },
  })


  const handleAddPersonnel = async () => {
    if (!newPersonnel.firstName || !newPersonnel.lastName || !newPersonnel.email || !newPersonnel.role) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setActionLoading(true);
      await addPersonnel(newPersonnel);
      
      toast.success("Personnel ajouté avec succès");
      setNewPersonnel({
        firstName: "",
        lastName: "",
        email: "",  
        role: "waiter", 
        password: "MotDePasse123!"
      });
      setIsDialogOpen(false);
      
      // Recharger les données
     
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout du personnel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPersonnel = async () => {
    if (!editingPersonnel) return;

    if (!editingPersonnel.firstName || !editingPersonnel.lastName || !editingPersonnel.email || !editingPersonnel.role) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setActionLoading(true);
      await updatePersonnel({
        id: editingPersonnel.id,
        firstName: editingPersonnel.firstName,
        lastName: editingPersonnel.lastName,
        email: editingPersonnel.email,
        role: editingPersonnel.role as "admin" | "manager" | "waiter" | "kitchen" | "cashier"
      });
      
      toast.success("Personnel modifié avec succès");
      setEditingPersonnel(null);
      setIsDialogOpen(false);
      
      // Recharger les données
     
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification du personnel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    setActionLoading(true);
    deletePersonnelMutation.mutate(id)
    setActionLoading(false);
  };

  const handleToggleStatus = async (id: string) => {
    setActionLoading(true);
    toggleStatusMutation.mutate(id)
    setActionLoading(false);
  };

  const getRoleLabel = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  const getRoleColor = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.color : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setNewPersonnel({ ...newPersonnel, password: newPassword });
  };

  const openEditDialog = (person: Personnel) => {
    setEditingPersonnel(person);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingPersonnel(null);
    setNewPersonnel({
      firstName: "",
      lastName: "",
      email: "",
      role: "waiter",
      password: "MotDePasse123!"
    });
    setIsDialogOpen(true);
  };
/* 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  } */

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Personnel</p>
                <p className="text-2xl font-bold text-primary">{stats?.total}</p>
              </div>
              <Users className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats?.active}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.byRole.manager || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serveurs</p>
                <p className="text-2xl font-bold text-green-600">{stats?.byRole.waiter || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau du personnel */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                Gestion du Personnel
              </CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et les permissions
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                  onClick={openAddDialog}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter un personnel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    {editingPersonnel ? "Modifier le personnel" : "Ajouter un personnel"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPersonnel ? "Modifiez les informations du personnel" : "Créez un nouveau compte personnel"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingPersonnel ? handleEditPersonnel : handleAddPersonnel}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          value={editingPersonnel ? editingPersonnel.firstName : newPersonnel.firstName}
                          onChange={(e) => editingPersonnel 
                            ? setEditingPersonnel({...editingPersonnel, firstName: e.target.value})
                            : setNewPersonnel({...newPersonnel, firstName: e.target.value})
                          }
                          className="border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={editingPersonnel ? editingPersonnel.lastName : newPersonnel.lastName}
                          onChange={(e) => editingPersonnel 
                            ? setEditingPersonnel({...editingPersonnel, lastName: e.target.value})
                            : setNewPersonnel({...newPersonnel, lastName: e.target.value})
                          }
                          className="border-primary/20 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editingPersonnel ? editingPersonnel.email : newPersonnel.email}
                        onChange={(e) => editingPersonnel 
                          ? setEditingPersonnel({...editingPersonnel, email: e.target.value})
                          : setNewPersonnel({...newPersonnel, email: e.target.value})
                        }
                        className="border-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select 
                        value={editingPersonnel ? editingPersonnel.role : newPersonnel.role}
                        onValueChange={(value: "admin" | "manager" | "waiter" | "kitchen" | "cashier") => editingPersonnel 
                          ? setEditingPersonnel({...editingPersonnel, role: value})
                          : setNewPersonnel({...newPersonnel, role: value})
                        }
                      >
                        <SelectTrigger className="border-primary/20 focus:border-primary w-full">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!editingPersonnel && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe par défaut</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={newPersonnel.password}
                            onChange={(e) => setNewPersonnel({...newPersonnel, password: e.target.value})}
                            className="border-primary/20 focus:border-primary pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGeneratePassword}
                            className="text-xs"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Générer
                          </Button>
                          <p className="text-xs text-muted-foreground flex items-center">
                            Le mot de passe sera envoyé par email
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingPersonnel(null);
                        setNewPersonnel({
                          firstName: "",
                          lastName: "",
                          email: "",
                          role: "waiter" as "admin" | "manager" | "waiter" | "kitchen" | "cashier",
                          password: "MotDePasse123!"
                        });
                      }}
                      disabled={actionLoading}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit"
                      disabled={actionLoading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      {editingPersonnel ? "Modifier" : "Ajouter"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {personnelLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement du personnel...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-medium">Nom complet</TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Rôle</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium">Date d&apos;ajout</TableHead>
                  <TableHead className="font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun personnel trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  personnel?.map((person) => (
                    <TableRow key={person.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        {person.firstName} {person.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {person.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(person.role)}>
                          {getRoleLabel(person.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={person.isActive ? "bg-green-500" : "bg-red-500"}>
                          {person.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(person.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(person)}
                            disabled={actionLoading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(person.id)}
                            disabled={actionLoading}
                            className={person.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                          >
                            {person.isActive ? "Désactiver" : "Activer"}
                          </Button>
                         
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className='cursor-pointer'>
                                <Trash2 />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous réellement sûr</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action ne peut pas être annulée. Elle supprimera définitivement votre compte et retirera vos données de nos serveurs.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction className='bg-red-500 text-white cursor-pointer hover:bg-red-600' onClick={() => handleDeletePersonnel(person.id)}>Continuer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 