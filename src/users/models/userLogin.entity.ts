import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('user_logins')
export class UserLoginsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column({nullable: true, type: 'float'})
    login_latitude: string;

    @Column({nullable: true, type: 'float'})
    login_longitude: string;

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    login_location: Point

    @Column({nullable: true, type: 'float'})
    logout_latitude: string;

    @Column({nullable: true, type: 'float'})
    logout_longitude: string;

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    logout_location: Point

    @Column({nullable: true})
    log_date: string

    @Column({nullable: true})
    loggedin_time: string

    @Column({nullable: true})
    loggedout_time: string
    
    @CreateDateColumn({default: new Date()})
    created_at: Date
}
