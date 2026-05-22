
import { User_entity } from "./user_entity";
import { Task_entity } from "./task_entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";



@Entity({ name: 'comments', schema: 'public' })
export class Comment_Entity {
    @PrimaryGeneratedColumn()
    comment_id: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    //relationship
    @ManyToOne(() => User_entity, (user) => user.comments)
    @JoinColumn({ name: "user_id" })
    user: User_entity;

    @ManyToOne(() => Task_entity, (task) => task.comments)
    @JoinColumn({ name: "task_id" })
    task: Task_entity;


}