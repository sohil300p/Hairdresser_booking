export interface CreateInvitationRequest {
  inviteePhone: string;
}

export interface InvitationItem {
  id: number;
  inviteePhone: string;
  token: string;
  status: string;
  createdAt: number;
  expiresAt: number;
  barbershopName: string;
}

export interface MemberItem {
  barberId: number;
  fullName: string | null;
  phone: string | null;
  role: string;
  isOwner: boolean;
  joinedAt?: number;
}

export interface PendingInviteForBarber {
  token: string;
  barbershopName: string;
  barbershopId: number;
  expiresAt: number;
}
