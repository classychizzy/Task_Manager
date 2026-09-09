"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project_service = void 0;
const project_repository_1 = require("../repositories/project_repository");
const projects_entity_1 = require("../entities/projects_entity");
const user_repository_1 = require("../repositories/user_repository");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../lib/logger");
const auditActions_1 = require("../enums/auditActions");
const auditlogs_1 = require("../utils/auditlogs");
const responsehelper_1 = require("../utils/responsehelper");
class Project_service {
    constructor() {
        this.ProjectRepository = project_repository_1.ProjectRepository;
        this.UserRepository = user_repository_1.UserRepository;
    }
    async CreateProject(CreateProjectDTO, userid) {
        try {
            const user = await this.UserRepository.findOne({
                where: {
                    user_id: userid
                }
            });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, "User not found");
            }
            logger_1.logger.info({ user_id: user.user_id }, 'user found');
            //check if project already exists
            const project = await this.ProjectRepository.findOne({
                where: {
                    user: { user_id: user.user_id },
                    name: CreateProjectDTO.name,
                    description: CreateProjectDTO.description,
                    is_deleted: false
                },
                relations: ["user"]
            });
            if (project) {
                return (0, responsehelper_1.errorResponse)(409, "Project already exists");
            }
            logger_1.logger.info({ project }, 'project already exists');
            const newProject = new projects_entity_1.Project_entity();
            logger_1.logger.info({ projectId: newProject.project_id }, 'New project instance created');
            /* this also works
            const newproject = await this.ProjectRepository.findOne({
                 where: {
                     name: CreateProjectDTO.name,
                     description: CreateProjectDTO.description,
                     user: user
                 }
             }); */
            newProject.name = CreateProjectDTO.name;
            newProject.description = CreateProjectDTO.description;
            newProject.user = user;
            logger_1.logger.info({ name: newProject.name, userId: user.user_id }, 'Project entity populated');
            await this.ProjectRepository.save(newProject);
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.PROJECT_CREATED,
                userId: userid,
                resource: "Project",
                resourceId: String(newProject.project_id),
                metadata: {
                    name: newProject.name,
                    description: newProject.description,
                }
            });
            return (0, responsehelper_1.successResponse)(201, "Project created successfully", newProject);
        }
        catch (error) {
            logger_1.logger.error({ err: error, user_id: userid }, 'Error creating project');
            let errorMessage = "unable to create project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
    async getAllProjects(userId, page, limit) {
        //implementation of pagination
        const { skip, take, page: currentPage, limit: pageSize } = (0, pagination_1.getPagination)(page, limit);
        try {
            const user = await this.UserRepository.findOne({
                where: {
                    user_id: userId
                }
            });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, "User not found");
            }
            const [projects, total] = await this.ProjectRepository.findAndCount({
                where: {
                    is_deleted: false,
                    user: {
                        user_id: userId
                    }
                },
                relations: ["user", "tasks"],
                skip,
                take,
                order: {
                    created_at: 'DESC'
                }
            });
            const sanitizedProjects = projects.map(project => {
                const { password, ...userWithoutPassword } = project.user;
                return {
                    ...project,
                    user: userWithoutPassword,
                };
            });
            logger_1.logger.info({ userId }, "Searching for projects with userId:");
            // First, check what projects exist with just the user filter: i used this to debug
            // const projectsWithoutDeletedFilter = await this.ProjectRepository
            //     .createQueryBuilder('project')
            //     .leftJoinAndSelect('project.user', 'user')
            //     .leftJoinAndSelect('project.tasks', 'tasks')
            //     .where('user.user_id = :userId', { userId })
            //     .getMany();
            // console.log("PROJECTS WITHOUT DELETED FILTER:", JSON.stringify(projectsWithoutDeletedFilter, null, 2));
            // Now check what happens when we add is_deleted filter
            // const projectsWithDeletedFilter = await this.ProjectRepository
            //     .createQueryBuilder('project')
            //     .leftJoinAndSelect('project.user', 'user')
            //     .leftJoinAndSelect('project.tasks', 'tasks')
            //     .where('user.user_id = :userId', { userId })
            //     .andWhere('project.is_deleted = :isDeleted', { isDeleted: false })
            //     .getMany();
            // console.log("PROJECTS WITH DELETED FILTER (false):", JSON.stringify(projectsWithDeletedFilter, null, 2));
            return (0, responsehelper_1.successResponse)(200, "Projects retrieved successfully", sanitizedProjects, {
                total,
                page: currentPage,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        }
        catch (error) {
            logger_1.logger.error({ err: error, userId }, 'Error retrieving all projects');
            let errorMessage = "unable to retreive projects";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
    async fetchProjectById(projectId, userId) {
        logger_1.logger.debug({ projectId, userId }, 'fetchProjectById called');
        try {
            // console.log("About to query database...");
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    is_deleted: false,
                    user: {
                        user_id: userId
                    }
                },
                relations: ["tasks"],
            });
            // console.log("Project found:", project);
            if (!project) {
                return (0, responsehelper_1.errorResponse)(404, "Project not found");
            }
            return (0, responsehelper_1.successResponse)(200, "Project retrieved successfully", project);
        }
        catch (error) {
            logger_1.logger.error({ err: error, projectId, userId }, 'Error fetching project by ID');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
    async updateProject(projectId, userId, updateData) {
        try {
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    is_deleted: false,
                    user: {
                        user_id: userId
                    }
                },
                relations: ["tasks"],
            });
            if (!project) {
                return (0, responsehelper_1.errorResponse)(404, "Project not found");
            }
            logger_1.logger.debug({ project }, "project found");
            if (!updateData.name && !updateData.description) {
                return (0, responsehelper_1.errorResponse)(400, "No update data provided");
            }
            if (updateData.name) {
                project.name = updateData.name;
            }
            if (updateData.description) {
                project.description = updateData.description;
            }
            project.updated_at = new Date();
            await this.ProjectRepository.save(project);
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.PROJECT_UPDATED,
                userId: userId,
                resource: "Project",
                resourceId: String(projectId),
                metadata: {
                    name: project.name,
                    description: project.description,
                }
            });
            return (0, responsehelper_1.successResponse)(200, "Project updated successfully", project);
        }
        catch (error) {
            logger_1.logger.error({ err: error, projectId, userId }, 'Error updating project');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
    async DeleteProject(projectId, userId) {
        try {
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    user: {
                        user_id: userId
                    },
                },
            });
            if (!project) {
                return (0, responsehelper_1.errorResponse)(404, "Project not found");
            }
            logger_1.logger.debug({ project }, "project found for deletion");
            if (project.is_deleted) {
                return (0, responsehelper_1.errorResponse)(409, "Project already deleted");
            }
            // soft delete implementation
            project.deleted_at = new Date();
            project.is_deleted = true;
            project.updated_at = new Date();
            logger_1.logger.info({ projectId, userId }, 'Project soft deleted');
            await this.ProjectRepository.save(project);
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.PROJECT_DELETED,
                userId: userId,
                resource: "Project",
                resourceId: String(projectId),
                metadata: {
                    name: project.name,
                    description: project.description,
                }
            });
            return (0, responsehelper_1.successResponse)(200, "Project deleted successfully", null);
        }
        catch (error) {
            logger_1.logger.error({ err: error, projectId, userId }, 'Error deleting project');
            let errorMessage = "unable to delete project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
    async restoreProject(projectId, userId) {
        try {
            const restoreProject = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    user: {
                        user_id: userId
                    }
                }
            });
            logger_1.logger.debug({ projectId }, 'Found project for restoration');
            if (!restoreProject) {
                return (0, responsehelper_1.errorResponse)(404, "Project not found");
            }
            if (!restoreProject.is_deleted) {
                // check for isdeleted attribute if false it means it was never deleted 
                // and hence cannot be restored
                return (0, responsehelper_1.errorResponse)(409, "Project is not deleted");
            }
            restoreProject.is_deleted = false;
            restoreProject.deleted_at = null;
            restoreProject.updated_at = new Date();
            logger_1.logger.info({ projectId, userId }, 'Project restored');
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.PROJECT_RESTORED,
                userId: userId,
                resource: "Project",
                resourceId: String(projectId),
                metadata: {
                    name: restoreProject.name,
                    description: restoreProject.description,
                }
            });
            await this.ProjectRepository.save(restoreProject);
            return (0, responsehelper_1.successResponse)(200, "Project restored successfully", null);
        }
        catch (error) {
            logger_1.logger.error({ err: error, projectId, userId }, 'Error restoring project');
            let errorMessage = "unable to restore project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, errorMessage);
        }
    }
}
exports.Project_service = Project_service;
