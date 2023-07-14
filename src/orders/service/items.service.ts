import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ItemRepository } from '../repository/item.repository';
import { Item } from '../entity/item.entity';
import { Brackets, EntityNotFoundError, Like } from 'typeorm';
import { ItemQueryRequestDto } from '../dto/item-request.dto';
import { ItemResponseDto, ItemSimpleResponseDto } from '../dto/item-response.dto';
import { Gender } from '../order.enum';
import { Page } from '../../common/pagination/page';
import { Category } from '../../common/type/categories.type';
import { PageRequest } from '../../common/pagination/page-request';

@Injectable()
export class ItemsService {
    constructor(private readonly itemRepository: ItemRepository) {}

    // 검색 조건에 맞는 상품 페이지 조회
    async findItemsByQuery(query: ItemQueryRequestDto, category: Category): Promise<Page<ItemSimpleResponseDto>> {
        const { pageNo, pageSize, keyword, gender, minPrice, maxPrice, size } = query;
        const page = new PageRequest(pageNo, pageSize);
        const [items, count] = await this.itemRepository.createQueryBuilder('item')
            .select('item')
            .where(new Brackets(qb => {
                qb.where('item.topCategory = :category', { category })
                    .orWhere('item.outerCategory = :category', { category })
                    .orWhere('item.pantsCategory = :category', { category })
                    .orWhere('item.shoesCategory = :category', { category });
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
                        default: qb.andWhere(qGender, { gender: Gender.UNISEX });
                    }
                }
                if (minPrice || maxPrice) {
                    if (minPrice && !maxPrice) {
                        qb.andWhere('item.price >= :minPrice', { minPrice });
                    } else if (!minPrice && maxPrice) {
                        qb.andWhere('item.price <= :maxPrice', { maxPrice });
                    } else {
                        qb.andWhere('item.price >= :minPrice', { minPrice })
                            .andWhere('item.price <= :maxPrice', { maxPrice });
                    }
                }
                if (size) {
                    qb.andWhere('item.size = :size', { size });
                }
            }))
            .offset(page.getOffset())
            .limit(page.getLimit())
            .orderBy('item.salesCount', 'DESC')
            .getManyAndCount();

        const itemResponseDtoList: ItemSimpleResponseDto[] = [];
        items.forEach(item => itemResponseDtoList.push(new ItemSimpleResponseDto(item)));
        return new Page(page.pageSize, count, itemResponseDtoList);
    }

    // 특정 상품 상세 조회
    async findItemDetailsByCode(itemCode: string): Promise<ItemResponseDto> {
        const item = await this.findItemByCode(itemCode);
        return new ItemResponseDto(item);
    }

    // TODO : 상품 생성
    async saveItem(): Promise<string> {
        return null;
    }

    private async findItemByCode(code: string): Promise<Item> {
        return await this.itemRepository.findOneByOrFail({ code })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 상품을 찾을 수 없습니다. Item Code : ${code}`);
                } else {
                    throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
    }
}