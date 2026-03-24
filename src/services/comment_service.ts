import { CommentRepository } from "../repositories/comment_repository";
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { Comment_Entity } from "../entities/comments_entity";
import { getPagination } from "../utils/pagination";
import { logger } from "../lib/logger";

export class Comment_Service {
    private commentRepository: typeof CommentRepository;
    private taskRepository: typeof TaskRepository;
    private userRepository: typeof UserRepository;

    constructor() {
        this.commentRepository = CommentRepository;
        this.taskRepository = TaskRepository;
        this.userRepository = UserRepository;
    }

    async createComment(taskId: number, userId: number, content: string, priorityLevel: string) {
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return { status_code: 404, message: 'Task not found', data: null };
            }

            const user = await this.userRepository.findOne({ where: { user_id: userId, is_deleted: false } });
            if (!user) {
                return { status_code: 404, message: 'User not found', data: null };
            }

            const newComment = new Comment_Entity();
            newComment.content = content;
            newComment.priority_level = priorityLevel;
            newComment.task = task;
            newComment.user = user;

            await this.commentRepository.save(newComment);

            return {
                status_code: 201,
                message: 'Comment created successfully',
                data: newComment
            };
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error creating comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async getCommentsForTask(taskId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return { status_code: 404, message: 'Task not found', data: null };
            }

            const [comments, total] = await this.commentRepository.findAndCount({
                where: { task: { task_id: taskId } },
                relations: ["user"],
                skip,
                take,
                order: { created_at: "DESC" }
            });

            return {
                status_code: 200,
                message: 'Comments retrieved successfully',
                data: comments,
                meta: {
                    total,
                    page: currentPage,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            };
        } catch (error) {
            logger.error({ err: error, taskId }, 'Error retrieving comments for task');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }




    async deleteComment(commentId: number, requesterId: number) {
        try {
            const comment = await this.commentRepository.findOne({
                where: {
                    comment_id: commentId,
                    user: { user_id: requesterId }
                },
                relations: ["user"]
            });

            if (!comment) {
                return { status_code: 404, message: 'Comment not found', data: null };
            }

            if (!requesterId) {
                return { status_code: 403, message: 'You can only delete your own comments', data: null };
            }

            await this.commentRepository.remove(comment);

            return {
                status_code: 200,
                message: 'Comment deleted successfully',
                data: null
            };
        } catch (error) {
            logger.error({ err: error, commentId, requesterId }, 'Error deleting comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async updateComment(commentId: number, userId: number, content?: string, priorityLevel?: string) {
        try {
            const comment = await this.commentRepository.findOne({
                where: {
                    comment_id: commentId,
                    user: { user_id: userId }
                },
                relations: ["user"]
            });

            if (!comment) {
                return { status_code: 404, message: 'Comment not found', data: null };
            }

            if (!comment.user.user_id) {
                return { status_code: 403, message: 'You can only update your own comments', data: null };
            }

            if (content) comment.content = content;
            if (priorityLevel) comment.priority_level = priorityLevel;

            await this.commentRepository.save(comment);

            return {
                status_code: 200,
                message: 'Comment updated successfully',
                data: comment
            };
        } catch (error) {
            logger.error({ err: error, commentId, userId }, 'Error updating comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
}
