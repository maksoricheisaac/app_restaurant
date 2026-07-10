import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membershipsService, invitesService } from '@/services/memberships.service';

export interface MembershipInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedByUser?: { id: string; name: string } | null;
}

export interface InvitePreview {
  email: string;
  role: string;
  restaurantName: string;
  restaurantLogo: string | null;
  valid: boolean;
  status: string;
}

const invitesQueryKey = ['membership-invites'] as const;

export const usePendingInvites = () => {
  return useQuery({
    queryKey: invitesQueryKey,
    queryFn: () => membershipsService.listInvites() as Promise<MembershipInvite[]>,
  });
};

export const useInviteByEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      membershipsService.inviteByEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['personnel'] });
    },
  });
};

export const useRevokeInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membershipsService.revokeInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKey });
    },
  });
};

export const useResendInvite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membershipsService.resendInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitesQueryKey });
    },
  });
};

export const useInvitePreview = (token: string) => {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => invitesService.getPreview(token) as Promise<InvitePreview>,
    enabled: !!token,
    retry: false,
  });
};

export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: (token: string) => invitesService.accept(token),
  });
};

export const useDeclineInvite = () => {
  return useMutation({
    mutationFn: (token: string) => invitesService.decline(token),
  });
};
