import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('portal_settings')
export class PortalSettingsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    setting_name: string

    @Column({default: false})
    setting_value: boolean

    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

}
