import { ProjectRepository } from '../repositories/project_repository'
import { CreateProjectDTO } from '../dto/create_project_dto'
import { Project_entity } from '../entities/projects_entity'
import { UserRepository } from '../repositories/user_repository'
import { User_entity } from '../entities/user_entity';
import { UpdateProjectDTO } from '../dto/updateproject_dto'
import { getPagination } from '../utils/pagination';
import { logger } from '../lib/logger';
import { AuditAction } from '../enums/auditActions';
import { auditLog } from '../utils/auditlogs';
import { successResponse, errorResponse } from '../utils/responsehelper';


export class Project_service {
    private ProjectRepository: typeof ProjectRepository;
    private UserRepository: typeof UserRepository;



    constructor() {
        this.ProjectRepository = ProjectRepository;
        this.UserRepository = UserRepository;

    }

    async CreateProject(CreateProjectDTO: CreateProjectDTO, userid: number) {

        try {
            const user = await this.UserRepository.findOne({
                where: {
                    user_id: userid
                }

            });


            if (!user) {

                return errorResponse(404, "User not found");
            }
            logger.info({ user_id: user.user_id }, 'user found')

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

                return errorResponse(409, "Project already exists");
            }

            logger.info({ project }, 'project already exists');

            const newProject = new Project_entity();
            logger.info({ projectId: newProject.project_id }, 'New project instance created');
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
            logger.info({ name: newProject.name, userId: user!.user_id }, 'Project entity populated');

            await this.ProjectRepository.save(newProject);

            auditLog({
                action: AuditAction.PROJECT_CREATED,
                userId: userid,
                resource: "Project",
                resourceId: String(newProject.project_id),
                metadata: {
                    name: newProject.name,
                    description: newProject.description,
                }
            })
            return successResponse(201, "Project created successfully", newProject);
        }
        catch (error) {
            logger.error({ err: error, user_id: userid }, 'Error creating project');
            let errorMessage = "unable to create project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return errorResponse(500, errorMessage);

        }



    }

    async getAllProjects(userId: number, page?: number, limit?: number) {
        //implementation of pagination
        const { skip, take, page: currentPage, limit: pageSize } =
            getPagination(page, limit);
        try {

            const user = await this.UserRepository.findOne({
                where: {
                    user_id: userId
                }
            });

            if (!user) {
                return errorResponse(404, "User not found");
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

            logger.info({ userId }, "Searching for projects with userId:");

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


            return successResponse(200, "Projects retrieved successfully", {
                meta: {
                    total,
                    page: currentPage,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            });
        } catch (error) {
            logger.error({ err: error, userId }, 'Error retrieving all projects');
            let errorMessage = "unable to retreive projects";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return errorResponse(500, errorMessage);


        }

    }

    async fetchProjectById(projectId: number, userId: number) {
        logger.debug({ projectId, userId }, 'fetchProjectById called');

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
            },

            );
            // console.log("Project found:", project);

            if (!project) {
                return errorResponse(404, "Project not found");
            }

            return successResponse(200, "Project retrieved successfully", {
                data: project,

            })
        }

        catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error fetching project by ID');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            return errorResponse(500, errorMessage);

        }


    }

    async updateProject(projectId: number, userId: number, updateData: UpdateProjectDTO) {
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

                return errorResponse(404, "Project not found");
            }

            logger.debug({ project }, "project found")

            if (updateData.name) {
                project.name = updateData.name;
            }

            if (updateData.description) {
                project.description = updateData.description;

            }

            project.updated_at = new Date();

            await this.ProjectRepository.save(project);

            auditLog({
                action: AuditAction.PROJECT_UPDATED,
                userId: userId,
                resource: "Project",
                resourceId: String(projectId),
                metadata: {
                    name: project.name,
                    description: project.description,
                }
            })

            return successResponse(200, "Project updated successfully", {
                data: project,
            });

        } catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error updating project');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return errorResponse(500, errorMessage);

        }
    }

    async DeleteProject(projectId: number, userId: number) {
        try {
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,

                    user: {
                        user_id: userId
                    }
                },

            });
            if (!project) {
                return errorResponse(404, "Project not found");

            }
            logger.debug({ project }, "project found for deletion")


            if (project.is_deleted) {
                return errorResponse(409, "Project already deleted");

            }
            // soft delete implementation
            project.deleted_at = new Date();
            project.is_deleted = true;
            project.updated_at = new Date();


            logger.info({ projectId, userId }, 'Project soft deleted');
            await this.ProjectRepository.save(project);

            auditLog({
                action: AuditAction.PROJECT_DELETED,
                userId: userId,
                resource: "Project",
                resourceId: String(projectId),
                metadata: {
                    name: project.name,
                    description: project.description,
                }
            })


            return successResponse(200, "Project deleted successfully", {
                data: null,

            });
        } catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error deleting project');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return errorResponse(500, errorMessage);

        }
    }
    async restoreProject(projectId: number, userId: number) {
        try {
            const restoreProject = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    is_deleted: true,
                    user: {
                        user_id: userId
                    }
                }
            });

            logger.debug({ projectId }, 'Found project for restoration');

            if (!restoreProject) {
                return errorResponse(404, "Project not found");

            }


            restoreProject.is_deleted = false;
            restoreProject.deleted_at = null;
            restoreProject.updated_at = new Date();
            logger.info({ projectId, userId }, 'Project restored');

            await this.ProjectRepository.save(restoreProject);

            return successResponse(200, "Project restored successfully", {
                data: null,
            });
        }
        catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error restoring project');
            let errorMessage = "unable to restore project";
            if (error instanceof Error) {

                errorMessage = error.message;
            }

            return errorResponse(500, errorMessage);

        }



    }



}