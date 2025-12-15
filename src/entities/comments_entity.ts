
import { User_entity } from "./user_entity";
import { Task_entity } from "./task_entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";



@Entity()
export class Comment_Entity {
    @PrimaryGeneratedColumn()
    comment_id: number;

    @Column({type: 'text'})
    content: string;

    @Column({type:'varchar'})
    priority_level: string;


    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    created_at: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updated_at: Date;

    //relationship
    @ManyToOne(() => User_entity, (user) => user.comments)
    user: User_entity;

    @ManyToOne(() => Task_entity, (task) => task.comments)
    task: Task_entity;


}