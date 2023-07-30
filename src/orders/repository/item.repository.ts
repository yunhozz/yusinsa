import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Item, Outer, Pants, Shoes, Top } from '../entity/item.entity';

class RootRepository<T extends Item> extends Repository<Item> { }

@CustomRepository(Item)
export class ItemRepository extends RootRepository<Item> { }

@CustomRepository(Top)
export class TopRepository extends RootRepository<Top> { }

@CustomRepository(Outer)
export class OuterRepository extends RootRepository<Outer> { }

@CustomRepository(Pants)
export class PantsRepository extends RootRepository<Pants> { }

@CustomRepository(Shoes)
export class ShoesRepository extends RootRepository<Shoes> { }