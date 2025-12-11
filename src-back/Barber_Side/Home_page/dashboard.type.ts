export interface GetDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    barberName: string | null;
    barbershopName: string | null;
    barbershopProfileImage: string | null;
    totalCustomers: number;
    activeReservations: number;
    weeklyRevenue: {
      sunday: number; // 0
      monday: number; // 1
      tuesday: number; // 2
      wednesday: number; // 3
      thursday: number; // 4
      friday: number; // 5
      saturday: number; // 6
    };
  };
}


