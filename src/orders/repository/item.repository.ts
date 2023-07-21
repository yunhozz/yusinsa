import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Item, Outer, Pants, Shoes, Top } from '../entity/item.entity';

@CustomRepository(Item)
export class ItemRepository<T extends Item> extends Repository<T> { }

@CustomRepository(Top)
export class TopRepository extends ItemRepository<Top> { }

@CustomRepository(Outer)
export class OuterRepository extends ItemRepository<Outer> { }

@CustomRepository(Pants)
export class PantsRepository extends ItemRepository<Pants> { }

@CustomRepository(Shoes)
export class ShoesRepository extends ItemRepository<Shoes> { }