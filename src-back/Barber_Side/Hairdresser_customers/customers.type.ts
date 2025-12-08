export interface GetCustomersResponse {
  success: boolean;
  message: string;
  data?: {
    customers: Array<{
      id: number;
      fullName: string | null;
      phone: string;
      email: string | null;
      avatar: string | null;
      gender: 'male' | 'female' | 'other' | null;
      visitCount: number; // تعداد دفعات مراجعه به این آرایشگاه
      lastVisitDate: number | null; // timestamp آخرین مراجعه
      totalSpent: number; // مجموع مبلغ پرداخت شده
      createdAt: number; // timestamp ثبت نام
      lastLoginAt: number | null; // timestamp آخرین ورود
    }>;
    total: number;
  };
}

