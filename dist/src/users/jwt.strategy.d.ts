import { Repository } from 'typeorm';
import { UsersEntity } from './models/users.entity';
declare const JwtStrategy_base: new (...args: unknown[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersRepository;
    constructor(usersRepository: Repository<UsersEntity>);
    validate(payload: any): Promise<UsersEntity>;
}
export {};
