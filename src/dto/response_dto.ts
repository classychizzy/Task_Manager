// src/dto/response.dto.ts

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ResponseDTO<T = null> {
    status_code: number;
    success: boolean;
    message: string;
    data?: T | undefined;
    error?: string | undefined;
    meta?: PaginationMeta | undefined;
}