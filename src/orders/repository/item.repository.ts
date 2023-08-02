import { Brackets, Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Item, Outer, Pants, Shoes, Top } from '../entity/item.entity';
import { Gender } from '../order.enum';
import { Category } from '../order.interface';

class RootRepository<T extends Item> extends Repository<Item> { }

@CustomRepository(Item)
export class ItemRepository extends RootRepository<Item> {
    selectItemById(id: bigint): Promise<Item> {
        return this.createQueryBuilder('item')
            .select(['item.code', 'item.name', 'item.price', 'item.size', 'item.image'])
            .where('item.id = :itemId', { id })
            .getOneOrFail();
    }

    selectItemsByCondition(
        category: Category,
        keyword: string,
        gender: Gender,
        minPrice: number,
        maxPrice: number,
        size: string,
        offset: number,
        limit: number
    ): Promise<[items: Item[], count: number]> {
        return this.createQueryBuilder('item')
            .select('item')
            .where(new Brackets(qb => {
                qb.where('item.topCategory = :category', { category })
                    .orWhere('item.outerCategory = :category', { category })
                    .orWhere('item.pantsCategory = :category', { category })
                    .orWhere('item.shoesCategory = :category', { category });
            }))
            .andWhere(new Brackets(qb => {
                if (keyword) {
                    qb.where('item.name like :keyword', { keyword: `%${keyword}%` })
                        .orWhere('item.description like :keyword', { keyword: `%${keyword}%` });
                }
            }))
            .andWhere(new Brackets(qb => {
                const genderEq = 'item.gender = :gender';
                if (gender) {
                    switch (gender) {
                        case Gender.MAN: qb.where(genderEq, { gender: Gender.MAN }); break;
                        case Gender.WOMAN: qb.where(genderEq, { gender: Gender.WOMAN }); break;
                        default: qb.where(genderEq, { gender: Gender.UNISEX });
                    }
                }
            }))
            .andWhere(new Brackets(qb => {
                if (minPrice || maxPrice) {
                    if (minPrice && !maxPrice) {
                        qb.where('item.price >= :minPrice', { minPrice });
                    } else if (!minPrice && maxPrice) {
                        qb.where('item.price <= :maxPrice', { maxPrice });
                    } else {
                        qb.where('item.price >= :minPrice', { minPrice })
                            .andWhere('item.price <= :maxPrice', { maxPrice });
                    }
                }
            }))
            .andWhere(new Brackets(qb => {
                if (size) {
                    qb.where('item.size = :size', { size });
                }
            }))
            .offset(offset)
            .limit(limit)
            .orderBy('item.salesCount', 'DESC')
            .getManyAndCount();
    }
}

@CustomRepository(Top)
export class TopRepository extends RootRepository<Top> { }

@CustomRepository(Outer)
export class OuterRepository extends RootRepository<Outer> { }

@CustomRepository(Pants)
export class PantsRepository extends RootRepository<Pants> { }

@CustomRepository(Shoes)
export class ShoesRepository extends RootRepository<Shoes> { }