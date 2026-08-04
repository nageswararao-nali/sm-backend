import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('seq_track', {
    orderBy: {
        id: 'DESC'
    }
})
export class SeqTrackEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    seqNumbers: string

    @Column()
    reqBody: string

    @Column()
    notes: string

    @CreateDateColumn()
    created_at: Date

}