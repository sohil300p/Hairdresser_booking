// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  message: string;
  timestamp: string;
  database: {
    connected: boolean;
    status: string;
  };
}

// Auth Types
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

export interface RegisterRequest {
  phone: string;
  password: string;
}

// User Types
export interface UserResponse {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  profileImage: string | null;
  role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export interface UpdateProfileResponse extends UserResponse {}

// Appointment Types
export interface AppointmentResponse {
  id: number;
  userId: number;
  barberId: number;
  appointmentDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  serviceType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentRequest {
  barberId: number;
  appointmentDate: Date;
  serviceType?: string;
  notes?: string;
}

// Barber Types
export interface BarberResponse {
  id: number;
  userId: number;
  specialization: string | null;
  experienceYears: number | null;
  rating: number | null;
  bio: string | null;
  profileImage: string | null;
  user: UserResponse;
  createdAt: Date;
  updatedAt: Date;
}

