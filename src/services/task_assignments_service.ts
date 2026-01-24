import { Task_assignment_Repository } from '../repositories/task_assignment_repository';
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { TaskPermission } from "../enums/Taskpermission_enum";
import { Task_assignment_entity } from "../entities/Task_assignment_entity";
import { AssignTaskDTO } from "../dto/assign_task_dto";
import { stat } from 'fs';


export class TaskAssignment_Service {
    private taskAssignmentRepository: typeof Task_assignment_Repository;
    private taskRepository: typeof TaskRepository;
    private userRepository: typeof UserRepository;

    constructor() {
        this.taskAssignmentRepository = Task_assignment_Repository;
        this.taskRepository = TaskRepository;
        this.userRepository = UserRepository;
    }

    async AssignUsertoTask(assignmentData: AssignTaskDTO, taskId: number, requesterId: number) {
        try {
            //verify if the task exists
            const task = await this.taskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false
                },
                // relations: ["project", "project.user"] // this is a non rbac way of checking ownership
            });

            if (!task) {
                return {
                    status_code: 404,
                    status: 'failed',
                    message: 'Task not found',
                    data: null
                };
            }

            // Verify requester is the project owner i.e has the ownership permission
            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false,
                },
            });

            if (
                !requesterAssignment ||
                requesterAssignment.permission !== TaskPermission.OWNER
            ) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'only owners are permitted to assign tasks',
                    data: null


                }
                return response;
            }

            // 3. Find user by email the user here is the asignee i.e the person we wish to assign
            const assignee = await this.userRepository.findOne({
                where: { email: assignmentData.email },
            });

            if (!assignee) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }
                return response;

            }

            //check if the task has already been assigned
            const existingAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: assignee.user_id },
                    is_deleted: false
                }
            });

            if (existingAssignment && !existingAssignment.is_deleted) {
                return {
                    status_code: 409,
                    status: 'failed',
                    message: 'User already assigned to this task',
                    data: null
                };
            }

            // let's check if the assignment was soft deleted assignment and restore
            if (existingAssignment && existingAssignment.is_deleted) {
                existingAssignment.is_deleted = false;
                existingAssignment.updated_at = new Date();
                await this.taskAssignmentRepository.save(existingAssignment);

                let response = {
                    status_code: 200,
                    status: 'success',
                    message: 'User assigned to task successfully',
                    data: existingAssignment
                }
                return response;
            }

            const newAssignment = new Task_assignment_entity();
            newAssignment.task = task;
            newAssignment.user = assignee;
            newAssignment.permission = assignmentData.permission ?? TaskPermission.VIEW;

            await this.taskAssignmentRepository.save(newAssignment);

            return {
                status_code: 201,
                status: 'success',
                message: 'user has  been assigned to the task successfully',
                data: newAssignment
            };
        } catch (error) {
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async UpdatePermission(Permission: TaskPermission,
        taskId: number, userId: number, requesterId: number) {
        // verify that the requester is the owner of the task
        const requester = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: requesterId },
                is_deleted: false


            }
        });

        if (!requester || requester.permission !== TaskPermission.OWNER) {
            let response = {
                status_code: 403,
                message: 'only owner can change permission',
                data: null
            }
            return response

        }

        const assignment = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: userId },
                is_deleted: false
            }
        });

        if (!assignment) {
            let response = {
                status_code: 404,
                message: 'Assignment not found',
                data: null
            }

        }
        assignment!.permission = Permission;
        assignment!.updated_at = new Date();
        await this.taskAssignmentRepository.save(assignment!);

        let response = {
            status_code: 200,
            message: 'Permission updated successfully',
            data: assignment
        }
        return response;


    }

    async removeUserFromTask(taskId: number, userId: number, requesterId: number) {

        const requester = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: requesterId },
                is_deleted: false
            }
        });
        if (!requester || requester.permission !== TaskPermission.OWNER) {
            let response = {
                status_code: 403,
                message: 'only owner can remove user from task',
                data: null
            }
            return response
        }

        const assignment = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: userId },
                is_deleted: false
            }
        });

        if (!assignment) {
            let response = {
                status_code: 404,
                message: 'Assignment not found',
                data: null
            }
            return response                             
            } 

            assignment.is_deleted = true;
            assignment.updated_at = new Date();
            await this.taskAssignmentRepository.save(assignment);

    }

    async getTaskAssignments(taskId: number, userId: number) {
        //check that any assigned user can view

        const hasAccess = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: userId },
                is_deleted: false
            }
        }); 

        if (!hasAccess) {
            let response = {
                status_code: 403,
                message:'access denied',
                data: null
            }
            return response 
        }

        const assignments = await this.taskAssignmentRepository.find({
            where: {
                task: { task_id: taskId },
                is_deleted: false
            },
            relations: [ "user"]
        });

        if (!assignments) {
            let response = {
                status_code: 404,
                message: 'No assignments found',
                data: null
            }
            return response

        }
        let response = {
            status_code: 200,
            message: 'Assignments retrieved successfully',
            data: assignments
        }
        return response;


    }

    


}
