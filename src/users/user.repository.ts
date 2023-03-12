import {Repository} from "typeorm";
import {User} from "./domain/user.entity";
import {CustomRepository} from "../config/custom-repository.decorator";
import {CreateUserRequestDto} from "./dto/request/create-user.request";
import {UserRole} from "./domain/user.role.enum";
import {UserProfileResponseDto} from "./dto/response/user-profile.response";
import {NotFoundException} from "@nestjs/common";

import * as bcrypt from 'bcrypt';

@CustomRepository(User)
export class UserRepository extends Repository<User> {
    async createUser(dto: CreateUserRequestDto): Promise<User> {
        const { email, password, name, age, si, gu, dong, etc, phoneNumber } = dto;
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user: User = await this.create({
            email,
            password: hashedPassword,
            name,
            age,
            address: { si, gu, dong, etc },
            phoneNumber,
            role: UserRole.USER
        });

        return await this.save(user);
    }

    async findOneByOptions(options: UserFindOptions): Promise<User> {
        const { id, email } = options;
        const qb = this.createQueryBuilder('User');

        if (id)
            qb.andWhere('User.id = :id', { id });
        if (email)
            qb.andWhere('User.email = :email', { email });

        return qb.getOne();
    }

    async findOneProfileById(id: bigint): Promise<UserProfileResponseDto> {
        const user = await this.findOneBy({ id });
        if (!user)
            throw new NotFoundException(`해당 유저를 찾을 수 없습니다. id : ${id}`);

        return {
            email: user.email,
            name: user.name,
            age: user.age
        };
    }
}

export interface UserFindOptions {
    id?: bigint;
    email?: string;
}