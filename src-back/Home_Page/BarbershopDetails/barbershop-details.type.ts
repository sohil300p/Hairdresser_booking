export interface GetBarbershopDetailsRequest {
  barbershopId: number;
  page?: number;
  limit?: number;
}

export interface CommentItem {
  id: number;
  customerName: string | null;
  customerAvatar: string | null;
  comment: string | null;
  rate: number | null;
  createdAt: number;
  replies?: CommentItem[];
}

export interface GalleryImage {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface BarbershopDetailsData {
  description: string | null;
  comments: CommentItem[];
  gallery: GalleryImage[];
  totalComments: number;
  averageRating: number;
  viewCount: number;
}

export interface GetBarbershopDetailsResponse {
  success: boolean;
  message: string;
  data?: BarbershopDetailsData;
}

