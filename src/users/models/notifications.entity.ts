import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('go_notifications')
export class NotificationsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    title: string;

    @Column({nullable: true})
    body: string;

    @Column()
    status: number;

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    viewed_by: number

    @CreateDateColumn({nullable: true})
    viewed_at: Date
}