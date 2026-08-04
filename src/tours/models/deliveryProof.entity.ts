import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('delivery_proof')
export class DeliveryProofEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    seq_num: number;

    @Column({ nullable: true })
    booking_id: number;

    @Column({ nullable: true })
    image_url: string;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    lat: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    lng: number;

    @CreateDateColumn()
    created_at: Date;
}
