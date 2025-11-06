import api from './api';

export interface ProfileData {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  profileImage: string | null;
  role: 'CUSTOMER' | 'BARBER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data?: ProfileData;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  profileImage?: File;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: ProfileData;
}

export const profileService = {
  async getProfile(): Promise<GetProfileResponse> {
    const response = await api.get<GetProfileResponse>('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const formData = new FormData();
    if (data.firstName !== undefined) {
      formData.append('firstName', data.firstName);
    }
    if (data.lastName !== undefined) {
      formData.append('lastName', data.lastName);
    }
    if (data.profileImage) {
      formData.append('profileImage', data.profileImage);
    }

    const response = await api.put<UpdateProfileResponse>('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

