import { Task_assignment_Repository } from '../repositories/task_assignment_repository';
import { TaskRepository } from "../repositories/task_repository";
import { UserRepository } from "../repositories/user_repository";
import { TaskPermission } from '../enums/Taskpermission_enum';
import { Task_assignment_entity } from "../entities/Task_assignment_entity";
import { AssignTaskDTO } from "../dto/assign_task_dto";
import { logger } from '../lib/logger';
import { auditLog } from '../utils/auditlogs';
import { AuditAction } from '../enums/auditActions';
import { successResponse, errorResponse } from '../utils/responsehelper';
import { getPagination } from '../utils/pagination';

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

                },
                // relations: ["project", "project.user"] // this is a non rbac way of checking ownership
            });

            if (!task) {
                return errorResponse(404, "task not found");

            }
            logger.info({ task }, 'task found for assignment')

            // Verify requester is the project owner i.e has the ownership permission
            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false,
                },
            });


            if (!requesterAssignment) {
                //404 consistent with security best practices - don't leak information
                return errorResponse(404, "you are not assigned to this task");
            }
            logger.info({ requesterAssignment }, 'requester assignment found')

            if (requesterAssignment.permission !== TaskPermission.OWNER) {
                return errorResponse(404, "only owners are permitted to assign tasks");
            }

            // 3. Find user by email the user here is the asignee i.e the person we wish to assign
            const assignee = await this.userRepository.findOne({
                where: { email: assignmentData.email },
            });
            logger.debug({ assigneeEmail: assignmentData.email, assigneeFound: !!assignee }, 'Assignee lookup');
            if (!assignee) {
                return errorResponse(404, 'user not found');

            }

            //check if the task has already been assigned
            const existingAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: assignee.user_id },

                }
            });

            if (existingAssignment && !existingAssignment.is_deleted) {
                return errorResponse(409, "user already assigned to this task");
            }

            // let's check if the assignment was soft deleted assignment and restore
            if (existingAssignment && existingAssignment.is_deleted) {
                existingAssignment.is_deleted = false;
                existingAssignment.updated_at = new Date();
                await this.taskAssignmentRepository.save(existingAssignment);


                return successResponse(200, "user unarchived successfully", existingAssignment);
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

            return successResponse(201, 'user assigned to task successfully', newAssignment);

        } catch (error) {
            logger.error({ err: error, taskId, requesterId, assigneeEmail: assignmentData.email }, 'Error in AssignUsertoTask');
            return errorResponse(500, 'internal server error');

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

                return errorResponse(404, 'only owner can change permission');
            }

            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false
                }
            });

            if (!assignment) {

                return errorResponse(404, 'assignment not found');
            }

            assignment.permission = Permission;
            assignment.updated_at = new Date();
            await this.taskAssignmentRepository.save(assignment);

            return successResponse(200, 'permission updated successfully', assignment);
        } catch (error) {
            logger.error({ err: error, taskId, userId, requesterId }, 'Error in UpdatePermission');
            return errorResponse(500, 'internal server error');
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
                return errorResponse(404, 'assignment not found');
            }

            let data = {
                permission: assignment.permission,
                canEdit: assignment.permission === TaskPermission.EDIT || assignment.permission === TaskPermission.OWNER,
                canDelete: assignment.permission === TaskPermission.OWNER,
                isOwner: assignment.permission === TaskPermission.OWNER


            }


            return successResponse(200, 'permission retrieved successfully', data);
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error in getUserTaskPermission');
            let message = "unable to retrieve task";
            if (error instanceof Error) {
                message = error.message;
            }
            return errorResponse(500, message);

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
                return errorResponse(404, "only owner can remove user from task");
            }
            //owner protection logic

            else if (userId === requesterId) {
                return errorResponse(409, "you cannot remove yourself from the task");
            }

            const assignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false
                }
            });

            if (!assignment) {
                return errorResponse(404, "assignment not found");
            }

            assignment.is_deleted = true;
            assignment.updated_at = new Date();
            await this.taskAssignmentRepository.save(assignment);
            logger.info({ taskId, userId, requesterId }, 'User removed from task');
            return successResponse(200, "user removed from task successfully", assignment);
        } catch (error) {
            logger.error({ err: error, taskId, userId, requesterId }, 'Error in removeUserFromTask');
            return errorResponse(500, 'internal server error');
        }
    }


    async getTaskAssignments(taskId: number, requesterId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);

        try {
            const task = await this.taskRepository.findOne({
                where: { task_id: taskId, is_deleted: false }
            });

            if (!task) {
                return errorResponse(404, 'Task not found');
            }

            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: { task: { task_id: taskId }, user: { user_id: requesterId }, is_deleted: false }
            });

            if (!requesterAssignment) {
                return errorResponse(404, "you must be assigned to the task to view its assignments");
            }

            const [assignments, total] = await this.taskAssignmentRepository.findAndCount({
                where: { task: { task_id: taskId }, is_deleted: false },
                relations: ["user"],
                skip,
                take,
                order: { created_at: 'DESC' }
            });

            const sanitizedAssignments = assignments.map(a => {
                const { password, ...userWithoutPassword } = a.user;
                return { ...a, user: userWithoutPassword };
            });

            return successResponse(200, "task assignments retrieved successfully", sanitizedAssignments, {
                total,
                page: currentPage,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            });

        } catch (error) {
            logger.error({ err: error, taskId, requesterId }, 'Error fetching task assignments');
            return errorResponse(500, 'internal server error while fetching task assignments');
        }
    }

    async getUserassignedtasks(userId: number) {
        try {
            const assignments = await this.taskAssignmentRepository.find({
                where: { user: { user_id: userId }, is_deleted: false },
                relations: ["task", "task.project"]
            });
            //console.log(assignments);
            const message = assignments.length === 0
                ? "you have no task assignments"
                : "user assignments retrieved successfully";

            return successResponse(200, message, assignments);
        } catch (error) {
            logger.error({ err: error, userId }, 'Error fetching user assignments');
            return errorResponse(500, 'internal server error while fetching user assignments');
        }
    }

    async getAssignmentsForOtherUser(targetUserId: number, requesterId: number) {
        try {
            const targetAssignments = await this.taskAssignmentRepository.find({
                where: { user: { user_id: targetUserId }, is_deleted: false },
                relations: ["task", "task.project"]
            });

            const ownedAssignments = await this.taskAssignmentRepository.find({
                where: {
                    user: { user_id: requesterId },
                    permission: TaskPermission.OWNER,
                    is_deleted: false
                },
                relations: ["task"]
            });

            const ownedTaskIds = new Set(ownedAssignments.map(a => a.task.task_id));

            const filteredAssignments = targetAssignments.filter(assignment =>
                ownedTaskIds.has(assignment.task.task_id)
            );

            if (filteredAssignments.length === 0) {
                return errorResponse(404, "no shared assignments found");
            }

            return successResponse(200, "user assignments retrieved successfully", filteredAssignments);

        } catch (error) {
            logger.error({ err: error, targetUserId, requesterId }, 'Error fetching other user assignments');
            return errorResponse(500, 'internal server error while fetching other user assignments');
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
                return errorResponse(404, "task not found");
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
                return errorResponse(404, "only owner can assign users to task");
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

            return successResponse(200, `Bulk assignment completed. Success: ${results.successful.length}, Failed: ${results.failed.length}, Skipped: ${results.skipped.length}`, results);

        } catch (error) {
            logger.error({ err: error, taskId, requesterId }, 'Error in bulkAssignUsers');
            return errorResponse(500, 'internal server error while bulk assigning users');
        }
    }

    async TransferOwnership(taskId: number, presentOwnerId: number, newOwnerEmail: string) {
        try {
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
                return errorResponse(404, "task not found");
            }

            const newOwnerUser = await this.userRepository.findOne({
                where: { email: newOwnerEmail, is_deleted: false }
            });

            if (!newOwnerUser) {
                return errorResponse(404, "user not found");
            }

            // to avoid transferring ownership to self
            if (newOwnerUser.user_id === presentOwnerId) {
                return errorResponse(409, "you already own this task");
            }

            let newOwnerAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: newOwnerUser.user_id },
                    is_deleted: false
                },
                relations: ['user']
            });

            if (!newOwnerAssignment) {
                newOwnerAssignment = this.taskAssignmentRepository.create({
                    task: { task_id: taskId },
                    user: { user_id: newOwnerUser.user_id },
                    permission: TaskPermission.OWNER,
                    is_deleted: false
                });
            } else {
                newOwnerAssignment.permission = TaskPermission.OWNER;
            }

            presentOwner.permission = TaskPermission.EDIT;

            await this.taskAssignmentRepository.save([presentOwner, newOwnerAssignment]);

            auditLog({
                action: AuditAction.TASK_OWNERSHIP_TRANSFERRED,
                userId: presentOwnerId,
                resource: "Task_assignment",
                resourceId: String(taskId),
                metadata: { newOwnerId: newOwnerUser.user_id, newOwnerEmail }
            });

            return successResponse(200, "ownership transferred successfully", { presentOwner, newOwnerAssignment });

        } catch (error) {
            logger.error({ err: error, taskId, presentOwnerId, newOwnerEmail }, 'Error in TransferOwnership');
            return errorResponse(500, 'internal server error while transferring ownership');
        }
    }



}