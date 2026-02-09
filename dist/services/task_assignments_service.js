"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment_Service = void 0;
const task_assignment_repository_1 = require("../repositories/task_assignment_repository");
const task_repository_1 = require("../repositories/task_repository");
const user_repository_1 = require("../repositories/user_repository");
const Taskpermission_enum_1 = require("../enums/Taskpermission_enum");
const Task_assignment_entity_1 = require("../entities/Task_assignment_entity");
class TaskAssignment_Service {
    constructor() {
        this.taskAssignmentRepository = task_assignment_repository_1.Task_assignment_Repository;
        this.taskRepository = task_repository_1.TaskRepository;
        this.userRepository = user_repository_1.UserRepository;
    }
    async AssignUsertoTask(assignmentData, taskId, requesterId) {
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
            if (!requesterAssignment) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'You are not assigned to this task',
                    data: null
                };
                return response;
            }
            if (requesterAssignment.permission !== Taskpermission_enum_1.TaskPermission.OWNER) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'only owners are permitted to assign tasks',
                    data: null
                };
                return response;
            }
            // 3. Find user by email the user here is the asignee i.e the person we wish to assign
            const assignee = await this.userRepository.findOne({
                where: { email: assignmentData.email },
            });
            console.log(assignee);
            if (!assignee) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                };
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
                };
                return response;
            }
            const newAssignment = new Task_assignment_entity_1.Task_assignment_entity();
            newAssignment.task = task;
            newAssignment.user = assignee;
            newAssignment.permission = assignmentData.permission ?? Taskpermission_enum_1.TaskPermission.VIEW;
            await this.taskAssignmentRepository.save(newAssignment);
            return {
                status_code: 201,
                status: 'success',
                message: 'user has  been assigned to the task successfully',
                data: newAssignment
            };
        }
        catch (error) {
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async UpdatePermission(Permission, taskId, userId, requesterId) {
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
        if (!requester || requester.permission !== Taskpermission_enum_1.TaskPermission.OWNER) {
            let response = {
                status_code: 403,
                message: 'only owner can change permission',
                data: null
            };
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
            };
            return response;
        }
        assignment.permission = Permission;
        assignment.updated_at = new Date();
        await this.taskAssignmentRepository.save(assignment);
        let response = {
            status_code: 200,
            message: 'Permission updated successfully',
            data: assignment
        };
        return response;
    }
    async getUserTaskPermission(taskId, userId) {
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
                };
                return response;
            }
            let data = {
                permission: assignment.permission,
                canEdit: assignment.permission === Taskpermission_enum_1.TaskPermission.EDIT || assignment.permission === Taskpermission_enum_1.TaskPermission.OWNER,
                canDelete: assignment.permission === Taskpermission_enum_1.TaskPermission.OWNER,
                isOwner: assignment.permission === Taskpermission_enum_1.TaskPermission.OWNER
            };
            let response = {
                status_code: 200,
                message: 'Permission retrieved successfully',
                data: data
            };
            return response;
        }
        catch (error) {
            let message = "unable to retrieve task";
            if (error instanceof Error) {
                message = error.message;
            }
            let response = {
                status_code: 500,
                errorMessage: message,
                data: null
            };
            return response;
        }
    }
    async removeUserFromTask(taskId, userId, requesterId) {
        const requester = await this.taskAssignmentRepository.findOne({
            where: {
                task: { task_id: taskId },
                user: { user_id: requesterId },
                is_deleted: false
            }
        });
        if (!requester || requester.permission !== Taskpermission_enum_1.TaskPermission.OWNER) {
            let response = {
                status_code: 403,
                message: 'only owner can remove user from task',
                data: null
            };
            return response;
        }
        //owner protection logic
        else if (userId === requesterId) {
            let response = {
                status_code: 403,
                message: 'You cannot remove yourself from the task',
                data: null
            };
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
            };
            return response;
        }
        assignment.is_deleted = true;
        assignment.updated_at = new Date();
        await this.taskAssignmentRepository.save(assignment);
        return {
            status_code: 200,
            message: 'User removed from task successfully',
            data: assignment
        };
    }
    async getTaskAssignments(taskId, requesterId) {
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
        }
        catch (error) {
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
    async getUserassignedtasks(userId) {
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
        }
        catch (error) {
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
    async getAssignmentsForOtherUser(targetUserId, requesterId) {
        try {
            //owner is able to check all users he's assigned tasks to
            const targetAssignments = await this.taskAssignmentRepository.find({
                where: { user: { user_id: targetUserId }, is_deleted: false },
                relations: ["task", "task.project"]
            });
            console.log(targetAssignments);
            if (targetAssignments.length === 0) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User has no assignments',
                    data: null
                };
                return response;
            }
            const filteredAssignments = [];
            for (const assignment of targetAssignments) {
                const isOwner = await this.taskAssignmentRepository.findOne({
                    where: {
                        task: { task_id: assignment.task.task_id },
                        user: { user_id: requesterId },
                        permission: Taskpermission_enum_1.TaskPermission.OWNER,
                        is_deleted: false
                    }
                });
                if (isOwner)
                    filteredAssignments.push(assignment);
            }
            console.log(filteredAssignments);
            if (filteredAssignments.length === 0) {
                return {
                    status_code: 403,
                    status: 'failed',
                    message: 'You do not share any tasks with this user',
                    data: null
                };
            }
            return { status_code: 200, status: 'success', message: 'User assignments retrieved', data: filteredAssignments };
        }
        catch (error) {
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while fetching other user assignments',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async bulkAssignUsers(assignments, taskId, requesterId) {
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
            console.log('Task found:', task);
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
            console.log('Requester assignment found:', requesterAssignment);
            if (!requesterAssignment || requesterAssignment.permission !== Taskpermission_enum_1.TaskPermission.OWNER) {
                return {
                    status_code: 403,
                    status: 'failed',
                    message: 'Access denied: Only owners can assign users to tasks',
                    data: null
                };
            }
            const results = {
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
                    console.log('Existing assignment found:', existingAssignment);
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
                    console.log('New assignment created:', newAssignment);
                    await this.taskAssignmentRepository.save(newAssignment);
                    results.successful.push({
                        email: assignment.email,
                        userId: user.user_id,
                        permission: assignment.permission
                    });
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error in bulkAssignUsersToTask service:', error);
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error while bulk assigning users',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
    async TransferOwnership(userId, taskId, presentOwnerId, newOwnerId) {
        try {
            const presentOwner = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: presentOwnerId },
                    is_deleted: false,
                    permission: Taskpermission_enum_1.TaskPermission.OWNER
                }
            });
            if (!presentOwner) {
                return { status_code: 403, message: 'You are not the owner of this task', data: null };
            }
            const newOwner = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: newOwnerId },
                    is_deleted: false
                },
            });
            if (!newOwner) {
                return { status_code: 404, message: 'New owner not found', data: null };
            }
            presentOwner.permission = Taskpermission_enum_1.TaskPermission.EDIT;
            newOwner.permission = Taskpermission_enum_1.TaskPermission.OWNER;
            await this.taskAssignmentRepository.save([presentOwner, newOwner]);
            return {
                status_code: 200,
                message: 'Ownership transferred successfully',
                data: { presentOwner, newOwner }
            };
        }
        catch (error) {
            return {
                status_code: 500,
                message: 'Internal server error.',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
}
exports.TaskAssignment_Service = TaskAssignment_Service;
