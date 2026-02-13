import api from './api';

export interface DefaultImages {
  defaultBarberProfileImageUrl: string;
  defaultBarberHeaderImageUrl: string;
}

export interface UpdateDefaultImagesPayload {
  defaultBarberProfileImageUrl?: string;
  defaultBarberHeaderImageUrl?: string;
  profileImageFile?: File;
  headerImageFile?: File;
}

export async function getDefaultImages(): Promise<DefaultImages> {
  const { data } = await api.get<{ success: boolean; data: DefaultImages }>('/admin/settings/default-images');
  if (!data.success || !data.data) throw new Error('Failed to load default images');
  return data.data;
}

export async function updateDefaultImages(payload: UpdateDefaultImagesPayload): Promise<DefaultImages> {
  const formData = new FormData();
  if (payload.defaultBarberProfileImageUrl !== undefined) {
    formData.append('defaultBarberProfileImageUrl', payload.defaultBarberProfileImageUrl);
  }
  if (payload.defaultBarberHeaderImageUrl !== undefined) {
    formData.append('defaultBarberHeaderImageUrl', payload.defaultBarberHeaderImageUrl);
  }
  if (payload.profileImageFile) {
    formData.append('profileImage', payload.profileImageFile);
  }
  if (payload.headerImageFile) {
    formData.append('headerImage', payload.headerImageFile);
  }

  const { data } = await api.put<{ success: boolean; data: DefaultImages }>('/admin/settings/default-images', formData);
  if (!data.success || !data.data) throw new Error('Failed to update default images');
  return data.data;
}
