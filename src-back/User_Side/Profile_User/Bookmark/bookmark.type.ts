// Bookmark Request/Response Types

export interface AddBookmarkRequest {
  barbershopId: number;
}

export interface AddBookmarkResponse {
  success: boolean;
  message: string;
  bookmarkId?: number;
}

export interface RemoveBookmarkRequest {
  barbershopId: number;
}

export interface RemoveBookmarkResponse {
  success: boolean;
  message: string;
}

export interface GetBookmarksResponse {
  success: boolean;
  message: string;
  bookmarks?: Array<{
    id: number;
    barbershopId: number;
    barbershop: {
      id: number;
      name: string;
      avatar: string | null;
      averageRating: number;
      ratingCount: number;
      priceFrom: number | null;
      isOpen: boolean;
      discountPercentage: number | null;
    };
    createdAt: number;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

