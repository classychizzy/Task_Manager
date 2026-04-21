
import { User_entity } from './user_entity';
import { Comment_Entity } from './comments_entity';
import { Project_entity } from './projects_entity';
import { TaskStatus } from '../enums/TaskStatus_enum'
import { Task_assignment_entity } from './Task_assignment_entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';





@Entity({ name: 'tasks', schema: 'public' })
export class Task_entity {
    @PrimaryGeneratedColumn()
    task_id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
    status: TaskStatus;

    @Column({ type: 'timestamp', nullable: true })
    dueDate: Date;

    @Column({ type: 'boolean', default: false })
    is_notified: boolean;

    @Column({ type: 'int', default: 1 })
    priority_level: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @Column({ type: 'timestamp', default: null, nullable: true })
    deleted_at: Date | null;


    @Column({ type: 'boolean', default: false })
    is_deleted: boolean;



    // relationships
    @ManyToOne(() => User_entity, (user) => user.tasks, { nullable: false })
    @JoinColumn({ name: "user_id" })
    User: User_entity;


    @ManyToOne(() => Project_entity, (project) => project.tasks)
    @JoinColumn({ name: "project_id" })
    project: Project_entity;

    @OneToMany(() => Task_assignment_entity, (task_assignment) => task_assignment.task)
    task_assignments: Task_assignment_entity[];

    @OneToMany(() => Comment_Entity, (comment) => comment.task)
    comments: Comment_Entity[];
    user_id: number;


}

