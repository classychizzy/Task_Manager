
import { Comment_Service } from "../services/comment_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";

export class Comment_Controller {
    public router: Router;
    private commentService: Comment_Service;

    constructor() {
        this.router = Router();
        this.commentService = new Comment_Service();
        this.initializeRoutes();
    }

    public async createComment(req: AuthenticatedRequest, res: Response) {
        const taskId = Number(req.params.taskId);
        const userId = req.user!.id;
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

    public async getCommentsForTask(req: AuthenticatedRequest, res: Response) {
        const taskId = Number(req.params.taskId);
        const result = await this.commentService.getCommentsForTask(taskId);
        return res.status(result.status_code).json(result);
    }

    public async deleteComment(req: AuthenticatedRequest, res: Response) {
        const commentId = Number(req.params.commentId);
        const requesterId = req.user!.id;

        const result = await this.commentService.deleteComment(commentId, requesterId);
        return res.status(result.status_code).json(result);
    }

    private initializeRoutes() {
        this.router.post('/comments/:taskId', this.createComment.bind(this));
        this.router.get('/comments/:taskId', this.getCommentsForTask.bind(this));
        this.router.delete('/comments/:commentId', this.deleteComment.bind(this));
    }
}
