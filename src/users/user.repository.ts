import {Repository} from "typeorm";
import {CustomRepository} from "../common/decorator/custom-repository.decorator";
import {User} from "./domain/user.entity";

@CustomRepository(User)
export class UserRepository extends Repository<User> {}