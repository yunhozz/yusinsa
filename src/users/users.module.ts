import {Module} from '@nestjs/common';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./domain/user.entity";
import {TypeOrmCustomModule} from "../config/type-orm-custom.module";
import {UserRepository} from "./user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([User]), TypeOrmCustomModule.forCustomRepository([UserRepository])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}