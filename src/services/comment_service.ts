import { CommentRepository } from "../repositories/comment_repository";
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { Comment_Entity } from "../entities/comments_entity";
import { CommentDTO } from "../dto/comment_dto";
import { getPagination } from "../utils/pagination";
import { logger } from "../lib/logger";
import { errorResponse, successResponse } from "../utils/responsehelper";
import { Task_assignment_Repository } from "../repositories/task_assignment_repository";
import { TaskPermission } from "../enums/Taskpermission_enum";

export class Comment_Service {
    private commentRepository: typeof CommentRepository;
    private taskRepository: typeof TaskRepository;
    private userRepository: typeof UserRepository;
    taskAssignmentRepository: any;

    constructor() {
        this.commentRepository = CommentRepository;
        this.taskRepository = TaskRepository;
        this.userRepository = UserRepository;
        this.taskAssignmentRepository = Task_assignment_Repository;
    }

    async createComment(taskId: number, userId: number, commentDTO: CommentDTO) {
        try {
            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }

            });

            if (!assignment) {
                return errorResponse(404, 'Task not found');
            }

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

    async getCommentsForTask(taskId: number, userId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);
        try {
            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }
            });

            if (!assignment) {
                return errorResponse(404, 'Task not found');
            }

            const task = await this.taskRepository.findOne({ where: { task_id: taskId, is_deleted: false } });
            if (!task) {
                return errorResponse(404, 'Task not found');
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

            return successResponse(200, 'Comments retrieved successfully', sanitizedComments, meta);


        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error retrieving comments for task');
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

            await this.commentRepository.remove(comment);

            return successResponse(200, 'Comment deleted successfully', null);
        } catch (error) {
            logger.error({ err: error, commentId, requesterId }, 'Error deleting comment');
            return errorResponse(500, 'Internal server error');
        }
    }

    async updateComment(commentId: number, userId: number, commentDTO: CommentDTO) {
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

            comment.content = commentDTO.content;
            comment.updated_at = new Date();

            await this.commentRepository.save(comment);

            return successResponse(200, 'Comment updated successfully', comment);
        } catch (error) {
            logger.error({ err: error, commentId, userId }, 'Error updating comment');
            return errorResponse(500, 'Internal server error');
        }
    }
}
