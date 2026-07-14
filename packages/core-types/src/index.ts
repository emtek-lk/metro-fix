export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}