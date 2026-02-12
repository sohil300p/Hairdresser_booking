import api from './api';

export interface DefaultImages {
  defaultBarberProfileImageUrl: string;
  defaultBarberHeaderImageUrl: string;
}

export async function getDefaultImages(): Promise<DefaultImages> {
  const { data } = await api.get<{ success: boolean; data: DefaultImages }>('/admin/settings/default-images');
  if (!data.success || !data.data) throw new Error('Failed to load default images');
  return data.data;
}

export async function updateDefaultImages(payload: Partial<DefaultImages>): Promise<DefaultImages> {
  const { data } = await api.put<{ success: boolean; data: DefaultImages }>('/admin/settings/default-images', payload);
  if (!data.success || !data.data) throw new Error('Failed to update default images');
  return data.data;
}
