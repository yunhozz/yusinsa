import { Repository } from 'typeorm';
import { CustomRepository } from '../common/decorator/custom-repository.decorator';
import { LocalUser, SocialUser, User } from './user.entity';

class RootRepository<T extends User> extends Repository<T> { }

@CustomRepository(User)
export class UserRepository extends RootRepository<User> { }

@CustomRepository(LocalUser)
export class LocalUserRepository extends RootRepository<LocalUser> { }

@CustomRepository(SocialUser)
export class SocialUserRepository extends RootRepository<SocialUser> { }