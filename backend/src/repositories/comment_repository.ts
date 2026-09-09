import { Repository } from "typeorm";
import AppDataSource from "../ormconfig";
import { Comment_Entity } from "../entities/comments_entity";

export const CommentRepository = AppDataSource.getRepository(Comment_Entity).extend({});
