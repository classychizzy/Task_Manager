import { str } from 'envalid';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User_entity } from './user_entity';

@Entity()
export class Refresh_entity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    user_id: number;

    @Column()
    tokenHash: string;

    @Column()
    expires_at: Date;

    @Column({ default: true })
    revoked: boolean;

    @CreateDateColumn()
    created_at: Date;

    //relationships
    @OneToOne(() => User_entity,
        {
            cascade: ["remove"],
            createForeignKeyConstraints: false
        })
    @JoinColumn()
    user: User_entity;



}
