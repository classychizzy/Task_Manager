import { CommentRepository } from "../repositories/comment_repository";
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { Comment_Entity } from "../entities/comments_entity";
import { CommentDTO } from "../dto/comment_dto";
import { getPagination } from "../utils/pagination";
import { logger } from "../lib/logger";
import { errorResponse, successResponse } from "../utils/responsehelper";

export class Comment_Service {
    private commentRepository: typeof CommentRepository;
    private taskRepository: typeof TaskRepository;
    private userRepository: typeof UserRepository;

    constructor() {
        this.commentRepository = CommentRepository;
        this.taskRepository = TaskRepository;
        this.userRepository = UserRepository;
    }

    async createComment(taskId: number, userId: number, commentDTO: CommentDTO) {
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return errorResponse(404, 'Task not found');
            }
            logger.debug({ task }, "Task fetched");

            const user = await this.userRepository.findOne({ where: { user_id: userId, is_deleted: false } });
            if (!user) {
                return errorResponse(404, 'User not found');
            }
            logger.info({ user }, "User fetched");

            const newComment = new Comment_Entity();
            newComment.content = commentDTO.content;
            newComment.task = task;
            newComment.user = user;

            await this.commentRepository.save(newComment);

            return successResponse(201, 'Comment created successfully', newComment);

        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error creating comment');
            return errorResponse(500, 'Internal server error');
        }
    }

    async getCommentsForTask(taskId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return errorResponse(404, 'Task not found');
            }
            logger.info({ task }, "Task fetched");

            const [comments, total] = await this.commentRepository.findAndCount({
                where: { task: { task_id: taskId } },
                relations: ["user"],
                skip,
                take,
                order: { created_at: "DESC" }
            });

            const meta = {
                total,
                page: currentPage,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            };

            return successResponse(200, 'Comments retrieved successfully', comments, meta);
        } catch (error) {
            logger.error({ err: error, taskId }, 'Error retrieving comments for task');
            return errorResponse(500, 'Internal server error');
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
                return errorResponse(404, 'Comment not found');
            }

            if (!requesterId) {
                return errorResponse(403, 'You can only delete your own comments');
            }

            await this.commentRepository.remove(comment);

            return successResponse(200, 'Comment deleted successfully', null);
        } catch (error) {
            logger.error({ err: error, commentId, requesterId }, 'Error deleting comment');
            return errorResponse(500, 'Internal server error');
        }
    }

    async updateComment(commentId: number, userId: number, CommentDTO: CommentDTO) {
        try {
            const comment = await this.commentRepository.findOne({
                where: {
                    comment_id: commentId,
                    user: { user_id: userId }
                },
                relations: ["user"]
            });

            if (!comment) {
                return errorResponse(404, 'Comment not found');
            }

            if (!comment.user.user_id) {
                return errorResponse(403, 'You can only update your own comments');
            }

            if (CommentDTO.content) comment.content = CommentDTO.content;

            await this.commentRepository.save(comment);

            return successResponse(200, 'Comment updated successfully', comment);
        } catch (error) {
            logger.error({ err: error, commentId, userId }, 'Error updating comment');
            return errorResponse(500, 'Internal server error');
        }
    }
}
