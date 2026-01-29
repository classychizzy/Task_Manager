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
            if (!requesterAssignment ||
                requesterAssignment.permission !== Taskpermission_enum_1.TaskPermission.OWNER) {
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
        let response = {
            status_code: 200,
            message: 'User removed from task successfully',
            data: assignment
        };
        return response;
    }
    async getTaskAssignments(taskId, userId) {
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
                message: 'access denied',
                data: null
            };
            return response;
        }
        const assignments = await this.taskAssignmentRepository.find({
            where: {
                task: { task_id: taskId },
                is_deleted: false
            },
            relations: ["user"]
        });
        if (!assignments) {
            let response = {
                status_code: 404,
                message: 'No assignments found',
                data: null
            };
            return response;
        }
        let response = {
            status_code: 200,
            message: 'Assignments retrieved successfully',
            data: assignments
        };
        return response;
    }
    async getUserassignedtasks(userId) {
        try {
            const assignments = await this.taskAssignmentRepository.find({
                where: {
                    user: { user_id: userId },
                    is_deleted: false
                },
                relations: ["task", "task.project"]
            });
            if (!assignments || assignments) {
                let response = {
                    status_code: 404,
                    message: 'No tasks assigned to you',
                    data: null
                };
                return response;
            }
            let response = {
                status_code: 200,
                message: 'Tasks retrieved successfully',
                data: assignments
            };
            return response;
        }
        catch (error) {
            let message = "unable to retrieve tasks";
            if (error instanceof Error) {
                message = error.message;
            }
            let response = {
                status_code: 500,
                message: 'Internal server error.',
                errorMessage: message,
                data: null
            };
            return response;
        }
    }
    async bulkAssignUsers(assignmentData, taskId, requesterId) {
        //used to assign multiple users at a time.
        try {
            const requesterAssignment = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: requesterId },
                    is_deleted: false,
                },
            });
            if (!requesterAssignment || requesterAssignment.permission == Taskpermission_enum_1.TaskPermission.OWNER) {
                let response = {
                    status_code: 403,
                    status: 'failed',
                    message: 'only users are allowed to make assignments',
                    data: null
                };
            }
            const results = [];
            for (const data of assignmentData) {
                const result = await this.AssignUsertoTask(data, taskId, requesterId);
                results.push(result);
            }
            let response = {
                status_code: 200,
                message: 'Users assigned to task successfully',
                data: results
            };
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                let response = {
                    status_code: 500,
                    message: 'Internal server error.',
                    errorMessage: error.message,
                    data: null
                };
                return response;
            }
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
                let response = {
                    status_code: 403,
                    message: 'You are not the owner of this task',
                    data: null
                };
                return response;
            }
            const newOwner = await this.taskAssignmentRepository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: newOwnerId },
                    is_deleted: false
                },
            });
            if (!newOwner) {
                let response = {
                    status_code: 404,
                    message: 'New owner not found',
                    data: null
                };
                return response;
            }
            presentOwner.permission = Taskpermission_enum_1.TaskPermission.EDIT;
            newOwner.permission = Taskpermission_enum_1.TaskPermission.OWNER;
            await this.taskAssignmentRepository.save([presentOwner, newOwner]);
            let response = {
                status_code: 200,
                message: 'Ownership transferred successfully',
                data: {
                    presentOwner: presentOwner,
                    newOwner: newOwner
                }
            };
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                let response = {
                    status_code: 500,
                    message: 'Internal server error.',
                    errorMessage: error.message,
                    data: null
                };
                return response;
            }
        }
    }
}
exports.TaskAssignment_Service = TaskAssignment_Service;
