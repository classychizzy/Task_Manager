import { Repository } from "typeorm";
import AppDataSource from "../ormconfig";
import { Project_entity } from "../entities/projects_entity";

export const ProjectRepository = AppDataSource.getRepository(Project_entity).extend({
});
