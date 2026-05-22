"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment_Service = void 0;
const comment_repository_1 = require("../repositories/comment_repository");
const task_repository_1 = require("../repositories/task_repository");
const user_repository_1 = require("../repositories/user_repository");
const comments_entity_1 = require("../entities/comments_entity");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../lib/logger");
class Comment_Service {
    constructor() {
        this.commentRepository = comment_repository_1.CommentRepository;
        this.taskRepository = task_repository_1.TaskRepository;
        this.userRepository = user_repository_1.UserRepository;
    }
    async createComment(taskId, userId, commentDTO) {
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return { status_code: 404, message: 'Task not found', data: null };
            }
            logger_1.logger.debug({ task }, "Task fetched");
            const user = await this.userRepository.findOne({ where: { user_id: userId, is_deleted: false } });
            if (!user) {
                return { status_code: 404, message: 'User not found', data: null };
            }
            logger_1.logger.debug({ user }, "User fetched");
            const newComment = new comments_entity_1.Comment_Entity();
            newComment.content = commentDTO.content;
            newComment.task = task;
            newComment.user = user;
            await this.commentRepository.save(newComment);
            return {
                status_code: 201,
                message: 'Comment created successfully',
                data: newComment
            };
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error creating comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async getCommentsForTask(taskId, page, limit) {
        const { skip, take, page: currentPage, limit: pageSize } = (0, pagination_1.getPagination)(page, limit);
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
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId }, 'Error retrieving comments for task');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async deleteComment(commentId, requesterId) {
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
        }
        catch (error) {
            logger_1.logger.error({ err: error, commentId, requesterId }, 'Error deleting comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async updateComment(commentId, userId, CommentDTO) {
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
            if (CommentDTO.content)
                comment.content = CommentDTO.content;
            await this.commentRepository.save(comment);
            return {
                status_code: 200,
                message: 'Comment updated successfully',
                data: comment
            };
        }
        catch (error) {
            logger_1.logger.error({ err: error, commentId, userId }, 'Error updating comment');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
}
exports.Comment_Service = Comment_Service;
