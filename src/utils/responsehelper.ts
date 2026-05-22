// global response helper

import { ResponseDTO, PaginationMeta } from "../dto/response_dto";

export const successResponse = <T>(
    statusCode: number,
    message: string,
    data: T,
    meta?: PaginationMeta
): ResponseDTO<T> => ({
    statusCode,
    success: true,
    message,
    data,
    meta
});

export const errorResponse = (
    statusCode: number,
    message: string,
    error?: string
): ResponseDTO => ({
    statusCode,
    success: false,
    message,
    error,
});