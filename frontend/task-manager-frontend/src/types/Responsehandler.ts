export interface ApiResponse<T = unknown> {
  status_code: number;
  status: string;
  message: string;
  data: T;
}