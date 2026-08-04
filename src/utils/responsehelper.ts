// global response helper

import { ResponseDTO, PaginationMeta } from "../dto/response_dto";

export const successResponse = <T>(
    status_code: number,
    message: string,
    data: T,
    meta?: PaginationMeta
): ResponseDTO<T> => ({
    status_code,
    success: true,
    message,
    data,
    meta
});

export const errorResponse = (
    status_code: number,
    message: string,
    error?: string
): ResponseDTO => ({
    status_code,
    success: false,
    message,
    error,
});