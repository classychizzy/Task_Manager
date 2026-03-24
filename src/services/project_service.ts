import { ProjectRepository } from '../repositories/project_repository'
import { CreateProjectDTO } from '../dto/create_project_dto'
import { Project_entity } from '../entities/projects_entity'
import { UserRepository } from '../repositories/user_repository'
import { User_entity } from '../entities/user_entity';
import { UpdateProjectDTO } from '../dto/updateproject_dto'
import { getPagination } from '../utils/pagination';
import { logger } from '../lib/logger';
export class Project_service {
    private ProjectRepository: typeof ProjectRepository;
    private UserRepository: typeof UserRepository;



    constructor() {
        this.ProjectRepository = ProjectRepository;
        this.UserRepository = UserRepository;

    }

    async CreateProject(CreateProjectDTO: CreateProjectDTO, userid: number) {
        const user = await this.UserRepository.findOne({
            where: {
                user_id: userid
            }
        });
        if (!user) {
            throw new Error('User not found');
        }

        const newProject = new Project_entity();
        logger.info({ projectId: newProject.project_id }, 'New project instance created');
        /* this also works
        const project = await this.ProjectRepository.findOne({
             where: {
                 name: CreateProjectDTO.name,
                 description: CreateProjectDTO.description,
                 user: user
             }
         }); */
        newProject.name = CreateProjectDTO.name;
        newProject.description = CreateProjectDTO.description;
        newProject.user = user;
        logger.info({ name: newProject.name, userId: user.user_id }, 'Project entity populated');

        await this.ProjectRepository.save(newProject);
        return newProject;




    }

    async getAllProjects(userId: number, page?: number, limit?: number) {
        //implementation of pagination
        const { skip, take, page: currentPage, limit: pageSize } =
            getPagination(page, limit);
        try {


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





            let response = {
                status_code: 200,
                status: 'success',
                message: 'Projects retrieved successfully',
                data: projects,
                meta: {
                    total,
                    page: currentPage,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            }
            return response;
        } catch (error) {
            logger.error({ err: error, userId }, 'Error retrieving all projects');
            let errorMessage = "unable to retreive projects";
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
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Project not found',
                    data: null
                }
                return response
            }

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Project retrieved successfully',
                data: project

            }
            return response
        }

        catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error fetching project by ID');
            let errorMessage = "unable to retreive project";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            let response = {
                status_code: "500",
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null

            }
            return response;

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
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Project not found',
                    data: null
                }
                return response
            }

            if (updateData.name) {
                project.name = updateData.name;
            }

            if (updateData.description) {
                project.description = updateData.description;

            }

            project.updated_at = new Date();

            await this.ProjectRepository.save(project);

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Project updated successfully',
                data: project
            }
            return response;
        } catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error updating project');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
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
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Project not found',
                    data: null
                }
                return response

            }


            if (project.is_deleted) {
                let response = {
                    status_code: 409,
                    status: 'failed',
                    message: 'Project already deleted',
                    data: null
                }
                return response
            }
            // soft delete implementation
            project.deleted_at = new Date();
            project.is_deleted = true;
            project.updated_at = new Date();


            logger.info({ projectId, userId }, 'Project soft deleted');
            await this.ProjectRepository.save(project);


            let response = {
                status_code: 200,
                status: 'success',
                message: 'Project deleted successfully',
                data: null

            }
            return response;
        } catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error deleting project');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
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
                let response = {
                    status_code: 404,
                    message: 'Project not found',
                    data: null
                }
                return response
            }


            restoreProject.is_deleted = false;
            restoreProject.deleted_at = null;
            restoreProject.updated_at = new Date();
            logger.info({ projectId, userId }, 'Project restored');

            await this.ProjectRepository.save(restoreProject);

            let response = {
                status_code: 200,
                message: 'Project restored successfully',
                data: null
            }
            return response;


        }
        catch (error) {
            logger.error({ err: error, projectId, userId }, 'Error restoring project');
            let errorMessage = "unable to restore project";
            if (error instanceof Error) {

                errorMessage = error.message;
            }
            let response = {

                status_code: 500,
                message: errorMessage,
                data: null
            }
            return response;
        }



    }



}