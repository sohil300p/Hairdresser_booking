export interface ScheduleItem {
  weekday: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
  isClosed: boolean;
}

export interface GetWorkingHoursResponse {
  success: boolean;
  message: string;
  data?: {
    schedules: ScheduleItem[];
  };
}

export interface CreateWorkingHoursRequest {
  schedules: {
    weekday: number;
    openTime: string; // HH:mm format
    closeTime: string; // HH:mm format
    isClosed?: boolean;
  }[];
}

export interface CreateWorkingHoursResponse {
  success: boolean;
  message: string;
  data?: {
    schedules: ScheduleItem[];
  };
}

export interface EditWorkingHoursRequest {
  schedules: {
    weekday: number;
    openTime?: string; // HH:mm format
    closeTime?: string; // HH:mm format
    isClosed?: boolean;
  }[];
}

export interface EditWorkingHoursResponse {
  success: boolean;
  message: string;
  data?: {
    schedules: ScheduleItem[];
  };
}




