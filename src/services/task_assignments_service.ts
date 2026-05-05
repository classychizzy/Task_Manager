import { Task_assignment_Repository } from '../repositories/task_assignment_repository';
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { TaskPermission } from '../enums/Taskpermission_enum';
import { Task_assignment_entity } from "../entities/Task_assignment_entity";
import { AssignTaskDTO } from "../dto/assign_task_dto";
import { serviceResponse } from '../types/serviceResponse';
import { logger } from '../lib/logger';
import { auditLog } from '../utils/auditlogs';
import { AuditAction } from '../enums/auditActions';


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
            logger.debug({ task }, 'task found for assignment')

            // Verify requester is the project owner i.e has the ownership permission
            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false,
                },
            });


            if (!requesterAssignment) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'You are not assigned to this task',
                    data: null
                }
                return response;
            }
            logger.info({ requesterAssignment }, 'requester assignment found')

            if (requesterAssignment.permission !== TaskPermission.OWNER) {
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
            logger.debug({ assigneeEmail: assignmentData.email, assigneeFound: !!assignee }, 'Assignee lookup');
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

            auditLog({
                action: AuditAction.TASK_ASSIGNED,
                resource: "Task_assignment",
                resourceId: String(newAssignment.task_assignment_id),
                metadata: {
                    task_id: taskId,
                    user_id: assignee.user_id,
                    permission: assignmentData.permission
                }
            })

            return {
                status_code: 201,
                status: 'success',
                message: 'user has  been assigned to the task successfully',
                data: newAssignment
            };
        } catch (error) {
            logger.error({ err: error, taskId, requesterId, assigneeEmail: assignmentData.email }, 'Error in AssignUsertoTask');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async UpdatePermission(Permission: TaskPermission, taskId: number, userId: number, requesterId: number) {
        try {
            logger.debug({ Permission, taskId, userId, requesterId }, 'UpdatePermission called');

            // verify that the requester is the owner of the task
            const requester = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false


                }
            });

            // console.log('=== DEBUG UpdatePermission ===');
            // console.log('requester:', requester);
            // console.log('requester exists:', !!requester);
            // if (requester) {
            //     console.log('requester.permission:', requester.permission);
            //     console.log('TaskPermission.OWNER:', TaskPermission.OWNER);
            //     console.log('Are they equal?:', requester.permission === TaskPermission.OWNER);
            //     console.log('Type of requester.permission:', typeof requester.permission);
            //     console.log('Type of TaskPermission.OWNER:', typeof TaskPermission.OWNER);
            // }
            // console.log('=== END DEBUG ===');

            if (!requester || requester.permission !== TaskPermission.OWNER) {
                let response = {
                    status_code: 403,
                    message: 'only owner can change permission',
                    data: null
                }
                return response;
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
                return response;
            }

            assignment.permission = Permission;
            assignment.updated_at = new Date();
            await this.taskAssignmentRepository.save(assignment);

            let response = {
                status_code: 200,
                message: 'Permission updated successfully',
                data: assignment
            }
            return response;
        } catch (error) {
            logger.error({ err: error, taskId, userId, requesterId }, 'Error in UpdatePermission');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async getUserTaskPermission(taskId: number, userId: number) {
        try {
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
                return response;
            }

            let data = {
                permission: assignment.permission,
                canEdit: assignment.permission === TaskPermission.EDIT || assignment.permission === TaskPermission.OWNER,
                canDelete: assignment.permission === TaskPermission.OWNER,
                isOwner: assignment.permission === TaskPermission.OWNER


            }


            let response = {
                status_code: 200,
                message: 'Permission retrieved successfully',
                data: data
            }
            return response;


        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error in getUserTaskPermission');
            let message = "unable to retrieve task";
            if (error instanceof Error) {
                message = error.message;
            }
            let response = {
                status_code: 500,
                errorMessage: message,
                data: null
            }
            return response;

        }
    }

    async removeUserFromTask(taskId: number, userId: number, requesterId: number) {
        try {
            logger.debug({ taskId, userId, requesterId }, 'removeUserFromTask called');
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
            //owner protection logic

            else if (userId === requesterId) {
                let response = {
                    status_code: 403,
                    message: 'You cannot remove yourself from the task',
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
            logger.info({ taskId, userId, requesterId }, 'User removed from task');
            return {
                status_code: 200,
                message: 'User removed from task successfully',
                data: assignment
            };
        } catch (error) {
            logger.error({ err: error, taskId, userId, requesterId }, 'Error in removeUserFromTask');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }





    async getTaskAssignments(taskId: number, requesterId: number) {
        // i think this endpoint needs pagination
        try {
            // to check assignment as a user
            const task = await this.taskRepository.findOne({
                where: { task_id: taskId, is_deleted: false }
            });

            if (!task) {
                return { status_code: 404, status: 'failed', message: 'Task not found', data: null };
            }

            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: { task: { task_id: taskId }, user: { user_id: requesterId }, is_deleted: false }
            });

            if (!requesterAssignment) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'Access denied: You must be assigned to the task to view its assignments',
                    data: null
                };
                return response;
            }

            const assignments = await this.taskAssignmentRepository.find({
                where: { task: { task_id: taskId }, is_deleted: false },
                relations: ["user"]
            });

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Task assignments retrieved',
                data: assignments
            };
            return response;
        } catch (error) {
            logger.error({ err: error, taskId, requesterId }, 'Error fetching task assignments');
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while fetching task assignments',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
            return response;
        }
    }

    async getUserassignedtasks(userId: number) {
        try {
            const assignments = await this.taskAssignmentRepository.find({
                where: { user: { user_id: userId }, is_deleted: false },
                relations: ["task", "task.project"]
            });
            //console.log(assignments);
            let response = {
                status_code: 200,
                status: 'success',
                message: 'Your assignments retrieved',
                data: assignments
            };
            return response;
        } catch (error) {
            logger.error({ err: error, userId }, 'Error fetching user assignments');
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while fetching user assignments',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
            return response;
        }
    }

    async getAssignmentsForOtherUser(targetUserId: number, requesterId: number) {
        try {
            //owner is able to check all users he's assigned tasks to
            const targetAssignments = await this.taskAssignmentRepository.find({
                where: { user: { user_id: targetUserId }, is_deleted: false },
                relations: ["task", "task.project"]
            });

            logger.debug({ targetUserId, assignmentCount: targetAssignments.length }, 'Target user assignments lookup');
            if (targetAssignments.length === 0) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User has no assignments',
                    data: null
                };
                return response;
            }

            const filteredAssignments: Task_assignment_entity[] = [];
            for (const assignment of targetAssignments) {
                const isOwner = await this.taskAssignmentRepository.findOne({
                    where: {
                        task: { task_id: assignment.task.task_id },
                        user: { user_id: requesterId },
                        permission: TaskPermission.OWNER,
                        is_deleted: false
                    }
                });
                if (isOwner) filteredAssignments.push(assignment);
            }

            logger.debug({ filteredCount: filteredAssignments.length }, 'Filtered assignments shared with requester');

            if (filteredAssignments.length === 0) {
                return {
                    status_code: 403,
                    status: 'failed',
                    message: 'You do not share any tasks with this user',
                    data: null
                };
            }

            return { status_code: 200, status: 'success', message: 'User assignments retrieved', data: filteredAssignments };
        } catch (error) {
            logger.error({ err: error, targetUserId, requesterId }, 'Error fetching other user assignments');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while fetching other user assignments',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async bulkAssignUsers(assignments: Array<{ email: string; permission: TaskPermission }>,
        taskId: number, requesterId: number) {

        /**
         * Bulk assign users to a task using emails (Owner only)
         */

        try {
            // Check if task exists

            // console.log('=== DEBUG bulkAssignUsersToTask ===');
            // console.log('RequesterId:', requesterId);
            // console.log('TaskId:', taskId);
            // console.log('Assignments:', JSON.stringify(assignments, null, 2));

            const task = await this.taskRepository.findOne({
                where: { task_id: taskId, is_deleted: false }
            });
            logger.debug({ taskId, taskFound: !!task }, 'Task lookup in bulkAssign');

            if (!task) {
                return {
                    status_code: 404,
                    status: 'failed',
                    message: 'Task not found',
                    data: null
                };
            }

            // Verify requester is the owner
            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false
                }
            });
            logger.debug({ requesterId, hasAssignment: !!requesterAssignment }, 'Requester assignment lookup in bulkAssign');

            if (!requesterAssignment || requesterAssignment.permission !== TaskPermission.OWNER) {
                return {
                    status_code: 403,
                    status: 'failed',
                    message: 'Access denied: Only owners can assign users to tasks',
                    data: null
                };
            }

            const results: {
                successful: Array<{ email: string; userId: number; permission: TaskPermission }>;
                failed: Array<{ email: string; reason: string }>;
                skipped: Array<{ email: string; userId: number; reason: string }>;
            } = {
                successful: [],
                failed: [],
                skipped: []
            };



            for (const assignment of assignments) {
                try {
                    // Normalize email (lowercase and trim)
                    const normalizedEmail = assignment.email.toLowerCase().trim();

                    // Find user by email
                    const user = await this.userRepository.findOne({
                        where: { email: normalizedEmail, is_deleted: false }
                    });

                    if (!user) {
                        results.failed.push({
                            email: assignment.email,
                            reason: 'User not found with this email'
                        });
                        continue;
                    }

                    // Check if user already assigned
                    const existingAssignment = await this.taskAssignmentRepository.findOne({
                        where: {
                            task: { task_id: taskId },
                            user: { user_id: user.user_id },
                            is_deleted: false
                        }
                    });
                    logger.debug({ email: normalizedEmail, alreadyAssigned: !!existingAssignment }, 'Checking existing assignment in bulkAssign loop');

                    if (existingAssignment) {
                        results.skipped.push({
                            email: assignment.email,
                            userId: user.user_id,
                            reason: 'User already assigned to this task'
                        });
                        continue;
                    }

                    // Create new assignment
                    const newAssignment = this.taskAssignmentRepository.create({
                        task: { task_id: taskId },
                        user: { user_id: user.user_id },
                        permission: assignment.permission,
                        is_deleted: false
                    });
                    logger.debug({ email: normalizedEmail }, 'New assignment created in bulkAssign loop');

                    await this.taskAssignmentRepository.save(newAssignment);

                    results.successful.push({
                        email: assignment.email,
                        userId: user.user_id,
                        permission: assignment.permission
                    });

                } catch (error) {
                    results.failed.push({
                        email: assignment.email,
                        reason: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            return {
                status_code: 200,
                status: 'success',
                message: `Bulk assignment completed. Success: ${results.successful.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`,
                data: results
            };

        } catch (error) {
            logger.error({ err: error, taskId, requesterId }, 'Error in bulkAssignUsers');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while bulk assigning users',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }




    async TransferOwnership(userId: number, taskId: number, presentOwnerId: number, newOwnerId: number) {
        try {
            logger.info({ taskId, presentOwnerId, newOwnerId }, 'TransferOwnership called');
            const presentOwner = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: presentOwnerId },
                    is_deleted: false,
                    permission: TaskPermission.OWNER
                },
                relations: ['user']
            });

            if (!presentOwner) {
                return { status_code: 403, message: 'You are not the owner of this task', data: null };
            }
            //verify if the request user is the same as the present owner
            if (presentOwner.user.user_id !== userId) {
                return { status_code: 403, message: 'You are not authorized to transfer ownership of this task', data: null };
            }

            //check if new owner exists in task assignment
            let newOwner = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: newOwnerId },
                    is_deleted: false
                },
                relations: ['user']
            });

            if (!newOwner) {
                //verify if the new owner is the same as the present owner
                const userExists = await this.userRepository.findOne({ where: { user_id: newOwnerId } });
                if (!userExists) {
                    return { status_code: 404, message: 'New owner not found', data: null };
                }


                // Create new assignment
                newOwner = this.taskAssignmentRepository.create({
                    task: { task_id: taskId },
                    user: { user_id: newOwnerId },
                    permission: TaskPermission.OWNER,
                    is_deleted: false
                });
            } else {
                // Update existing assignment to OWNER
                newOwner.permission = TaskPermission.OWNER;
            }

            presentOwner.permission = TaskPermission.EDIT;

            await this.taskAssignmentRepository.save([presentOwner, newOwner]);

            // Update the task owner (creator) field
            const task = await this.taskRepository.findOne({ where: { task_id: taskId } });
            if (task) {
                task.user_id = newOwnerId; // Update the task's user relationship
                await this.taskRepository.save(task);
            }

            return {
                status_code: 200,
                message: 'Ownership transferred successfully',
                data: { presentOwner, newOwner }
            };
        } catch (error) {
            logger.error({ err: error, taskId, presentOwnerId, newOwnerId }, 'Error in TransferOwnership');
            return {
                status_code: 500,
                message: 'Internal server error.',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
}
