import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class UsersEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    mobile: string;

    @Column()
    user_type: string;

    @Column()
    status: string;

    @Column()
    is_available: boolean;

    @Column({nullable: true})
    device_token: string;

    @Column({nullable: true})
    company_name: string;

    @Column({nullable: true})
    company_type: string;

    @Column({nullable: true})
    cc_id: number;
}