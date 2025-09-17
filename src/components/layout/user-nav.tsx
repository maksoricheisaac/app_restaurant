"use client";
import { LayoutDashboard, ListOrdered, LogOutIcon, MoreVerticalIcon} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";

export function UserNav({
  user
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}) {
  const [loading, setLoading] = useState(false);
 

  const handleLogout = async () => {
  setLoading(true)
   await signOut()
   setLoading(false)
  };

  const displayName = user?.name || "Utilisateur";
  const displayEmail = user?.email || "-";
  const displayAvatar = user?.avatar || "/avatar.png";
  const role = ( user?.role && user?.role == "user" ) ? "client" : user.role
  const canGoToDashboard = ['admin', 'waiter',' owner']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Ouvrir le menu utilisateur"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback className="rounded-lg">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col text-left text-sm leading-tight">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
          </div>
          <MoreVerticalIcon className="ml-auto size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-lg">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {canGoToDashboard.includes(role) && (
            <DropdownMenuItem asChild>
            <Link href={`/admin/dashboard`}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
          </DropdownMenuItem>
          )

          }
          <DropdownMenuItem asChild>
            <Link
              href={`order-tracking`}
            >
              <ListOrdered />
              Suivi de commande
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loading} className="text-red-600 focus:text-red-700">
          <LogOutIcon className="mr-2 h-4 w-4" />
          {loading ? "Déconnexion..." : "Déconnexion"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
