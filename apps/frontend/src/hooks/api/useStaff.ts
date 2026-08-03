import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffService, invitesService } from '@/services/staff.service';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export interface StaffInvite {
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
  restaurantName: string | null;
  restaurantLogo: string | null;
  valid: boolean;
  status: string;
}

const staffKey = ['staff'] as const;
const invitesKey = ['staff-invites'] as const;

function useStaffMutation<TArgs>(mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKey });
      queryClient.invalidateQueries({ queryKey: invitesKey });
    },
  });
}

export const useStaff = () =>
  useQuery({
    queryKey: staffKey,
    queryFn: () => staffService.list() as Promise<StaffMember[]>,
  });

export const useCreateStaff = () =>
  useStaffMutation((data: Parameters<typeof staffService.create>[0]) =>
    staffService.create(data),
  );

export const useUpdateStaff = () =>
  useStaffMutation(
    ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      staffService.update(id, data),
  );

export const useRemoveStaff = () =>
  useStaffMutation((id: string) => staffService.remove(id));

export const useTransferOwnership = () =>
  useStaffMutation((userId: string) => staffService.transferOwnership(userId));

// ─── Invitations ────────────────────────────────────────────────────────────

export const usePendingInvites = () =>
  useQuery({
    queryKey: invitesKey,
    queryFn: () => staffService.listInvites() as Promise<StaffInvite[]>,
  });

export const useInviteByEmail = () =>
  useStaffMutation((data: { email: string; role: string }) =>
    staffService.inviteByEmail(data),
  );

export const useRevokeInvite = () =>
  useStaffMutation((id: string) => staffService.revokeInvite(id));

export const useResendInvite = () =>
  useStaffMutation((id: string) => staffService.resendInvite(id));

export const useInvitePreview = (token: string) =>
  useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => invitesService.getPreview(token) as Promise<InvitePreview>,
    enabled: !!token,
    retry: false,
  });

export const useAcceptInvite = () =>
  useMutation({
    mutationFn: ({
      token,
      name,
      password,
    }: {
      token: string;
      name: string;
      password: string;
    }) => invitesService.accept(token, { name, password }),
  });

export const useDeclineInvite = () =>
  useMutation({
    mutationFn: (token: string) => invitesService.decline(token),
  });
