import { Comment_Service } from "../services/comment_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";
import { logger } from "../lib/logger";

export class Comment_Controller {
    public router: Router;
    private commentService: Comment_Service;

    constructor() {
        this.router = Router();
        this.commentService = new Comment_Service();
        this.initializeRoutes();
    }

    public async createComment(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;
            const { content, priority_level } = req.body;

            logger.debug({ taskId, userId }, 'createComment called');

            if (!content || !priority_level) {
                return res.status(400).json({
                    status_code: 400,
                    message: 'Content and priority level are required',
                    data: null
                });
            }

            const result = await this.commentService.createComment(taskId, userId, content, priority_level);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in createComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getCommentsForTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            logger.debug({ taskId }, 'getCommentsForTask called');
            const { page, limit } = req.query;

            const result = await this.commentService.getCommentsForTask(
                taskId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getCommentsForTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async deleteComment(req: AuthenticatedRequest, res: Response) {
        try {
            const commentId = Number(req.params.commentId);
            const requesterId = req.user!.id;
            logger.debug({ commentId, requesterId }, 'deleteComment called');

            const result = await this.commentService.deleteComment(commentId, requesterId);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in deleteComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async updateComment(req: AuthenticatedRequest, res: Response) {
        try {
            const commentId = Number(req.params.commentId);
            const userId = req.user!.id;
            const { content, priority_level } = req.body;
            logger.debug({ commentId, userId }, 'updateComment called');

            const result = await this.commentService.updateComment(commentId, userId, content, priority_level);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in updateComment');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    private initializeRoutes() {
        this.router.post('/comments/:taskId', this.createComment.bind(this));
        this.router.get('/comments/:taskId', this.getCommentsForTask.bind(this));
        this.router.delete('/comments/:commentId', this.deleteComment.bind(this));
        this.router.put('/comments/:commentId', this.updateComment.bind(this));
    }
}
