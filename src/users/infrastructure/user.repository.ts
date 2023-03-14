import {Repository} from "typeorm";
import {User} from "../domain/user.entity";
import {CustomRepository} from "../../config/custom-repository.decorator";
import {Role} from "../domain/role.enum";
import {NotFoundException, UnauthorizedException} from "@nestjs/common";
import {CreateUserRequestDto, UserLoginRequestDto} from "../dto/user-request.dto";
import {UserProfileResponseDto} from "../dto/user-response.dto";

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
            roles: [Role.USER]
        });

        return await this.save(user);
    }

    async validateLogin(dto: UserLoginRequestDto): Promise<{ email: string, roles: Role[] }> {
        const { email, password } = dto;
        const user = await this.findOneBy({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            return {
                email: user.email,
                roles: user.roles
            };
        } else {
            throw new UnauthorizedException(`이메일 또는 비밀번호를 잘못 입력하셨습니다.`);
        }
    }

    async findOneProfileById(id: bigint): Promise<UserProfileResponseDto> {
        const user = await this.findOneBy({ id });
        if (!user) {
            throw new NotFoundException(`해당 유저를 찾을 수 없습니다. id : ${id}`);
        }

        return {
            email: user.email,
            name: user.name,
            age: user.age
        };
    }
}