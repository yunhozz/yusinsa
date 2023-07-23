import { CustomRepository } from '../common/decorator/custom-repository.decorator';
import { Repository } from 'typeorm';
import { LocalUser, User } from './user.entity';

class RootRepository<T extends User> extends Repository<T> { }

@CustomRepository(User)
export class UserRepository extends RootRepository<User> { }

@CustomRepository(LocalUser)
export class LocalUserRepository extends RootRepository<LocalUser> { }