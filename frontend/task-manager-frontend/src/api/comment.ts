import apiClient from "./client";
import type { ApiResponse } from "../types/Responsehandler";
import type { Comment } from "../types/comment";

export async function getComments(): Promise<ApiResponse<Comment[]>> {
    const { data } = await apiClient.get<ApiResponse<Comment[]>>("/comments");
    return data;
}

export async function getComment(comment_id: string): Promise<ApiResponse<Comment>> {
    const { data } = await apiClient.get<ApiResponse<Comment>>(`/comments/${comment_id}`);
    return data;
}