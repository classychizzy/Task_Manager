"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment_Controller = void 0;
const comment_service_1 = require("../services/comment_service");
const express_1 = require("express");
const logger_1 = require("../lib/logger");
const validateDto_1 = require("../middlewares/validateDto");
const comment_dto_1 = require("../dto/comment_dto");
class Comment_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.commentService = new comment_service_1.Comment_Service();
        this.initializeRoutes();
    }
    async createComment(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user.id;
            const { content } = req.body;
            logger_1.logger.debug({ taskId, userId }, 'createComment called');
            if (!content) {
                return res.status(400).json({
                    status_code: 400,
                    message: 'Content is required',
                    data: null
                });
            }
            const result = await this.commentService.createComment(taskId, userId, content);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in createComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getCommentsForTask(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            logger_1.logger.debug({ taskId }, 'getCommentsForTask called');
            const { page, limit } = req.query;
            const result = await this.commentService.getCommentsForTask(taskId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getCommentsForTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async deleteComment(req, res) {
        try {
            const commentId = Number(req.params.commentId);
            const requesterId = req.user.id;
            logger_1.logger.debug({ commentId, requesterId }, 'deleteComment called');
            const result = await this.commentService.deleteComment(commentId, requesterId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in deleteComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async updateComment(req, res) {
        try {
            const commentId = Number(req.params.commentId);
            const userId = req.user.id;
            const { content } = req.body;
            logger_1.logger.debug({ commentId, userId }, 'updateComment called');
            const result = await this.commentService.updateComment(commentId, userId, content);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in updateComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/comments/:taskId', (0, validateDto_1.validateDto)(comment_dto_1.CommentDTO), this.createComment.bind(this));
        this.router.get('/comments/:taskId', this.getCommentsForTask.bind(this));
        this.router.delete('/comments/:commentId', this.deleteComment.bind(this));
        this.router.put('/comments/:commentId', this.updateComment.bind(this));
    }
}
exports.Comment_Controller = Comment_Controller;
