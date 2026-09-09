"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment_Service = void 0;
const comment_repository_1 = require("../repositories/comment_repository");
const task_repository_1 = require("../repositories/task_repository");
const user_repository_1 = require("../repositories/user_repository");
const comments_entity_1 = require("../entities/comments_entity");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../lib/logger");
const responsehelper_1 = require("../utils/responsehelper");
const task_assignment_repository_1 = require("../repositories/task_assignment_repository");
class Comment_Service {
    constructor() {
        this.commentRepository = comment_repository_1.CommentRepository;
        this.taskRepository = task_repository_1.TaskRepository;
        this.userRepository = user_repository_1.UserRepository;
        this.taskAssignmentRepository = task_assignment_repository_1.Task_assignment_Repository;
    }
    async createComment(taskId, userId, commentDTO) {
        try {
            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }
            });
            if (!assignment) {
                return (0, responsehelper_1.errorResponse)(404, 'Task not found');
            }
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return (0, responsehelper_1.errorResponse)(404, 'Task not found');
            }
            logger_1.logger.debug({ task }, "Task fetched");
            const user = await this.userRepository.findOne({ where: { user_id: userId, is_deleted: false } });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            logger_1.logger.info({ user }, "User fetched");
            const newComment = new comments_entity_1.Comment_Entity();
            newComment.content = commentDTO.content;
            newComment.task = task;
            newComment.user = user;
            await this.commentRepository.save(newComment);
            return (0, responsehelper_1.successResponse)(201, 'Comment created successfully', newComment);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error creating comment');
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error');
        }
    }
    async getCommentsForTask(taskId, userId, page, limit) {
        const { skip, take, page: currentPage, limit: pageSize } = (0, pagination_1.getPagination)(page, limit);
        try {
            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }
            });
            if (!assignment) {
                return (0, responsehelper_1.errorResponse)(404, 'Task not found');
            }
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return (0, responsehelper_1.errorResponse)(404, 'Task not found');
            }
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
            const sanitizedComments = comments.map(c => {
                const { password, ...userWithoutPassword } = c.user;
                return { ...c, user: userWithoutPassword };
            });
            return (0, responsehelper_1.successResponse)(200, 'Comments retrieved successfully', sanitizedComments, meta);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error retrieving comments for task');
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error');
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
                return (0, responsehelper_1.errorResponse)(404, 'Comment not found');
            }
            await this.commentRepository.remove(comment);
            return (0, responsehelper_1.successResponse)(200, 'Comment deleted successfully', null);
        }
        catch (error) {
            logger_1.logger.error({ err: error, commentId, requesterId }, 'Error deleting comment');
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error');
        }
    }
    async updateComment(commentId, userId, commentDTO) {
        try {
            const comment = await this.commentRepository.findOne({
                where: {
                    comment_id: commentId,
                    user: { user_id: userId }
                },
                relations: ["user"]
            });
            if (!comment) {
                return (0, responsehelper_1.errorResponse)(404, 'Comment not found');
            }
            comment.content = commentDTO.content;
            comment.updated_at = new Date();
            await this.commentRepository.save(comment);
            return (0, responsehelper_1.successResponse)(200, 'Comment updated successfully', comment);
        }
        catch (error) {
            logger_1.logger.error({ err: error, commentId, userId }, 'Error updating comment');
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error');
        }
    }
}
exports.Comment_Service = Comment_Service;
