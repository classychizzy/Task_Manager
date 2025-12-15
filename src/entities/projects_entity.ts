
import { User_entity } from "./user_entity";
import { Task_entity } from "./task_entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";


@Entity()
export class Project_entity {
    @PrimaryGeneratedColumn()
    project_id: number;

    @Column({type: 'varchar', length: 255})
    name: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    created_at: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updated_at: Date;

    // relationships
    @ManyToOne(() => User_entity, (user) => user.projects, { onDelete: "CASCADE" })
    user: User_entity;

    @OneToMany(() => Task_entity, (task) => task.project)
    tasks: Task_entity[];



}