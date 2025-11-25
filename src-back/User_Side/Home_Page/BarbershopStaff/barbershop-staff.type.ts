export interface GetBarbershopStaffRequest {
  barbershopId: number;
}

export interface StaffItem {
  id: number;
  fullName: string | null;
  specialization: string | null;
  experienceYears: number | null;
  bio: string | null;
  avatar: string | null;
  gender: string | null;
  appointmentCount: number;
  averageRating: number;
}

export interface GetBarbershopStaffResponse {
  success: boolean;
  message: string;
  data?: {
    staff: StaffItem[];
    total: number;
    viewCount: number;
  };
}

