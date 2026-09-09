import { Comment_Service } from "../services/comment_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";
import { logger } from "../lib/logger";
import { validateDto } from "../middlewares/validateDto";
import { CommentDTO } from "../dto/comment_dto";

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
            const commentDTO: CommentDTO = req.body;

            if (isNaN(taskId)) {
                return res.status(400).json({
                    status_code: 400,
                    success: false,
                    message: 'Invalid task ID',
                    data: null
                });
            }

            logger.debug({ taskId, userId }, 'createComment called');

            const result = await this.commentService.createComment(taskId, userId, commentDTO);
            return res.status(result.status_code || 201).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in createComment');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }

    public async getCommentsForTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;

            if (isNaN(taskId)) {
                return res.status(400).json({ status_code: 400, success: false, message: 'Invalid task ID', data: null });
            }

            const { page, limit } = req.query;
            const result = await this.commentService.getCommentsForTask(
                taskId,
                userId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );

            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getCommentsForTask');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }

    public async deleteComment(req: AuthenticatedRequest, res: Response) {
        try {
            const commentId = Number(req.params.commentId);
            const requesterId = req.user!.id;
            logger.debug({ commentId, requesterId }, 'deleteComment called');

            if (isNaN(commentId)) {
                return res.status(400).json({
                    status_code: 400,
                    success: false,
                    message: 'Invalid comment ID',
                    data: null
                });
            }

            const result = await this.commentService.deleteComment(commentId, requesterId);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in deleteComment');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error' });
        }
    }

    public async updateComment(req: AuthenticatedRequest, res: Response) {
        try {
            const commentId = Number(req.params.commentId);
            const userId = req.user!.id;

            if (isNaN(commentId)) {
                return res.status(400).json({
                    status_code: 400,
                    success: false,
                    message: 'Invalid comment ID',
                    data: null
                });
            }

            logger.debug({ commentId, userId }, 'updateComment called');

            const result = await this.commentService.updateComment(commentId, userId, req.body);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in updateComment');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }

    private initializeRoutes() {
        this.router.post('/create/:taskId', validateDto(CommentDTO), this.createComment.bind(this));
        this.router.get('/task/:taskId', this.getCommentsForTask.bind(this));
        this.router.delete('/delete/:commentId', this.deleteComment.bind(this));
        this.router.put('/update/:commentId', validateDto(CommentDTO), this.updateComment.bind(this));
    }
}
