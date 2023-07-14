import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ItemRepository } from '../repository/item.repository';
import { Item } from '../entity/item.entity';
import { Brackets, EntityNotFoundError, Like } from 'typeorm';
import { ItemQueryRequestDto } from '../dto/item-request.dto';
import { ItemResponseDto, ItemSimpleResponseDto } from '../dto/item-response.dto';
import { Gender } from '../order.enum';
import { Page } from '../../common/pagination/page';
import { Category } from '../../common/type/categories.type';

@Injectable()
export class ItemsService {
    constructor(private readonly itemRepository: ItemRepository) {}

    async findItemsByQuery(query: ItemQueryRequestDto, category: Category): Promise<Page<ItemSimpleResponseDto>> {
        const { page, keyword, gender, minPrice, maxPrice, size} = query;
        const [items, count] = await this.itemRepository.createQueryBuilder('item')
            .select('item')
            .where(new Brackets(qb => {
                qb.where(`item.topCategory = ${category}`)
                    .orWhere(`item.outerCategory = ${category}`)
                    .orWhere(`item.pantsCategory = ${category}`)
                    .orWhere(`item.shoesCategory = ${category}`)
            }))
            .andWhere(new Brackets(qb => {
                if (keyword) {
                    qb.where('item.name = :name', { name : Like(`%${keyword}%`) })
                        .orWhere('item.description = :description', { description : Like(`%${keyword}%`) })
                }
                const qGender = 'item.gender = :gender';
                if (gender) {
                    switch (gender) {
                        case Gender.MAN: qb.andWhere(qGender, { gender : Gender.MAN }); break;
                        case Gender.WOMAN: qb.andWhere(qGender, { gender : Gender.WOMAN }); break;
                        default: qb.andWhere(qGender, { gender : Gender.UNISEX });
                    }
                } else {
                    qb.andWhere(qGender, { gender : Gender.MAN })
                        .orWhere(qGender, { gender : Gender.WOMAN })
                        .orWhere(qGender, { gender : Gender.UNISEX });
                }
                if (minPrice || maxPrice) {
                    if (minPrice && !maxPrice) {
                        qb.andWhere(`item.price >= ${minPrice}`);
                    } else if (!minPrice && maxPrice) {
                        qb.andWhere(`item.price <= ${maxPrice}`);
                    } else {
                        qb.andWhere(`item.price >= ${minPrice}`)
                            .andWhere(`item.price <= ${maxPrice}`);
                    }
                }
                if (size) {
                    qb.andWhere(`item.size = ${size}`);
                }
            }))
            .offset(page.getOffset())
            .limit(page.getLimit())
            .orderBy('item.salesCount', 'DESC')
            .getManyAndCount();

        const itemResponseDtoList: ItemSimpleResponseDto[] = [];
        for (const item of items) {
            itemResponseDtoList.push(new ItemSimpleResponseDto(item));
        }
        return new Page(page.pageSize, count, itemResponseDtoList);
    }

    async findItemDetailsByCode(itemCode: string): Promise<ItemResponseDto> {
        const item = await this.findItemByCode(itemCode);
        return new ItemResponseDto(item);
    }

    private async findItemByCode(code: string): Promise<Item> {
        return await this.itemRepository.findOneByOrFail({ code })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 상품을 찾을 수 없습니다. Item Code : ${code}`);
                } else {
                    throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
    }
}