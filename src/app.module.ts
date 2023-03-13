import {Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {TypeOrmModule} from "@nestjs/typeorm";
import {typeOrmConfig} from "./config/type-orm.config";

@Module({
    imports: [TypeOrmModule.forRoot(typeOrmConfig), UsersModule]
})
export class AppModule {}