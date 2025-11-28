export interface CommentItem {
  id: number;
  customerName: string | null;
  customerAvatar: string | null;
  comment: string | null;
  rate: number | null; // 1-5 stars
  serviceId: number | null;
  serviceName: string | null;
  appointmentStartTime: number | null; // timestamp in milliseconds
  appointmentEndTime: number | null; // timestamp in milliseconds
  createdAt: number;
}

export interface GetCommentsResponse {
  success: boolean;
  message: string;
  data?: {
    comments: CommentItem[];
    averageRating: number; // Average of all ratings from 1-5
    totalComments: number;
  };
}

