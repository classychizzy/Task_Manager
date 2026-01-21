//import { Task_assignment_entity } from '../../entities/task_assignment_entity';
import { Task_assignment_Repository } from '../repositories/task_assignment_repository';
import { Task_assignmentDTO } from '../dto/task_assignment_dto'
import { TaskRepository } from '../repositories/task_repository';
import { UserRepository } from '../repositories/user_repository';
import { Task_assignment_entity } from '../entities/Task_assignment_entity';

export class TaskAssignment_Service {
    private TaskAssignmentRepository: typeof Task_assignment_Repository;
    private TaskRepository: typeof TaskRepository;
    private UserRepository: typeof UserRepository;

    constructor() {
        this.TaskAssignmentRepository = Task_assignment_Repository;
        this.TaskRepository = TaskRepository;
        this.UserRepository = UserRepository;
    }

    async assignTask(assignmentDTO: Task_assignmentDTO, taskId: number, userId: number) {
        // Verify task exists and belongs to the user (via project) before assigning
        const task = await this.TaskRepository.findOne({
            where: {
                task_id: taskId,
                is_deleted: false,
                project: {
                    user: {
                        user_id: userId
                    }
                }
            }
        });

        if (!task) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Task not found or access denied',
                data: null
            }
            return response;
        }

        // Verify the user to be assigned exists
        const assignee = await this.UserRepository.findOne({
            where: {
                user_id: userId,
            }
        });

        if (!assignee) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Assignee user not found',
                data: null
            }
            return response;
        }

        const newAssignment = new Task_assignment_entity();
        newAssignment.task = task;
        newAssignment.user = assignee;
        newAssignment.created_at = new Date();
        
        await this.TaskAssignmentRepository.save(newAssignment);
        return newAssignment;
    }

    async getAssignmentsByTaskId(taskId: number, userId: number) {
        try {
            const assignments = await this.TaskAssignmentRepository.find({
                where: {
                    is_deleted: false,
                    task: {
                        task_id: taskId,
                        project: {
                            user: {
                                user_id: userId
                            }
                        }
                    }
                },
                relations: ["user", "task"]
            });

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Assignments retrieved successfully',
                data: assignments
            }
            return response;

        } catch (error) {
            let errorMessage = "unable to retrieve assignments";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            }
            return response;
        }
    }

    async deleteAssignment(assignmentId: number, userId: number) {
        const assignment = await this.TaskAssignmentRepository.findOne({
            where: {
                assignment_id: assignmentId,
                task: {
                    project: {
                        user: {
                            user_id: userId
                        }
                    }
                }
            }
        });

        if (!assignment) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Assignment not found',
                data: null
            }
            return response;
        }

        // soft delete implementation
        assignment.is_deleted = true;
        assignment.updated_at = new Date();

        await this.TaskAssignmentRepository.save(assignment);

        let response = {
            status_code: 200,
            status: 'success',
            message: 'Assignment deleted successfully',
            data: null
        }
        return response;
    }
}
