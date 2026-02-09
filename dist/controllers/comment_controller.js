"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment_Controller = void 0;
const comment_service_1 = require("../services/comment_service");
const express_1 = require("express");
class Comment_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.commentService = new comment_service_1.Comment_Service();
        this.initializeRoutes();
    }
    async createComment(req, res) {
        const taskId = Number(req.params.taskId);
        const userId = req.user.id;
        const { content, priority_level } = req.body;
        if (!content || !priority_level) {
            return res.status(400).json({
                status_code: 400,
                message: 'Content and priority level are required',
                data: null
            });
        }
        const result = await this.commentService.createComment(taskId, userId, content, priority_level);
        return res.status(result.status_code).json(result);
    }
    async getCommentsForTask(req, res) {
        const taskId = Number(req.params.taskId);
        const result = await this.commentService.getCommentsForTask(taskId);
        return res.status(result.status_code).json(result);
    }
    async deleteComment(req, res) {
        const commentId = Number(req.params.commentId);
        const requesterId = req.user.id;
        const result = await this.commentService.deleteComment(commentId, requesterId);
        return res.status(result.status_code).json(result);
    }
    initializeRoutes() {
        this.router.post('/comments/:taskId', this.createComment.bind(this));
        this.router.get('/comments/:taskId', this.getCommentsForTask.bind(this));
        this.router.delete('/comments/:commentId', this.deleteComment.bind(this));
    }
}
exports.Comment_Controller = Comment_Controller;
