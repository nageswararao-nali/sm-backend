import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class CategoriesEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    cate_type: string
	
    @Column({nullable: true})
    cate_name: string
	
    @Column({nullable: true})
    extra: string
	
    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date
}