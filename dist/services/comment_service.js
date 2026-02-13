"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment_Service = void 0;
const comment_repository_1 = require("../repositories/comment_repository");
const task_repository_1 = require("../repositories/task_repository");
const user_repository_1 = require("../repositories/user_repository");
const comments_entity_1 = require("../entities/comments_entity");
class Comment_Service {
    constructor() {
        this.commentRepository = comment_repository_1.CommentRepository;
        this.taskRepository = task_repository_1.TaskRepository;
        this.userRepository = user_repository_1.UserRepository;
    }
    async createComment(taskId, userId, content, priorityLevel) {
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return { status_code: 404, message: 'Task not found', data: null };
            }
            const user = await this.userRepository.findOne({ where: { user_id: userId, is_deleted: false } });
            if (!user) {
                return { status_code: 404, message: 'User not found', data: null };
            }
            const newComment = new comments_entity_1.Comment_Entity();
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
        }
        catch (error) {
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async getCommentsForTask(taskId) {
        try {
            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return { status_code: 404, message: 'Task not found', data: null };
            }
            const comments = await this.commentRepository.find({
                where: { task: { task_id: taskId } },
                relations: ["user"],
                order: { created_at: "DESC" }
            });
            return {
                status_code: 200,
                message: 'Comments retrieved successfully',
                data: comments
            };
        }
        catch (error) {
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
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async updateComment(commentId, userId, content, priorityLevel) {
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
            if (content)
                comment.content = content;
            if (priorityLevel)
                comment.priority_level = priorityLevel;
            await this.commentRepository.save(comment);
            return {
                status_code: 200,
                message: 'Comment updated successfully',
                data: comment
            };
        }
        catch (error) {
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
