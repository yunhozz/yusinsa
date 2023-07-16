import { v1 as uuid } from 'uuid';
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ItemRepository } from '../repository/item.repository';
import { Item, Outer, Pants, Shoes, Top } from '../entity/item.entity';
import { Brackets, EntityNotFoundError } from 'typeorm';
import { ItemQueryRequestDto, ItemRequestDto, ItemUpdateRequestDto } from '../dto/item-request.dto';
import { ItemResponseDto, ItemSimpleResponseDto } from '../dto/item-response.dto';
import { CATEGORIES, Gender, OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../order.enum';
import { Page } from '../../common/pagination/page';
import { PageRequest } from '../../common/pagination/page-request';
import { InjectRepository } from '@nestjs/typeorm';
import { Category, CategoryEnum } from '../../common/type/category.type';

@Injectable()
export class ItemsService {
    constructor(
        @InjectRepository(Item)
        private readonly itemRepository: ItemRepository<Item>,
        @InjectRepository(Top)
        private readonly topRepository: ItemRepository<Top>,
        @InjectRepository(Outer)
        private readonly outerRepository: ItemRepository<Outer>,
        @InjectRepository(Pants)
        private readonly pantsRepository: ItemRepository<Pants>,
        @InjectRepository(Shoes)
        private readonly shoesRepository: ItemRepository<Shoes>
    ) {}

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
                    qb.where('item.name like :keyword', { keyword : `%${keyword}%` })
                        .orWhere('item.description like :keyword', { keyword : `%${keyword}%` });
                }
            }))
            .andWhere(new Brackets(qb => {
                const genderEq = 'item.gender = :gender';
                if (gender) {
                    switch (gender) {
                        case Gender.MAN: qb.where(genderEq, { gender : Gender.MAN }); break;
                        case Gender.WOMAN: qb.where(genderEq, { gender : Gender.WOMAN }); break;
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

    // 상품 추가
    async addItem(dto: ItemRequestDto): Promise<string> {
        const { name, size, categoryParent, categoryChild } = dto;
        const exist = await this.itemRepository.exist({ where : { name } });

        if (exist) {
            throw new BadRequestException(`해당 이름을 가진 상품이 이미 존재합니다. name : ${name}`);
        }
        const extraObj: ItemExtraObject = { code : uuid(), salesCount : 0 };
        const baseObj: ItemBaseObject = { ...dto, ...extraObj };
        const categoryEnum: CategoryEnum = CATEGORIES[categoryParent];
        const category = categoryEnum[categoryChild];

        if (!category) {
            throw new BadRequestException(`카테고리를 잘못 입력했습니다. 입력 : ${categoryChild}`);
        }
        switch (categoryEnum.valueOf()) {
            case TopCategory:
                const topObj: ItemObject = { ...baseObj, topCategory : category, size };
                const top = this.topRepository.create(topObj);
                await this.topRepository.save(top);
                break;
            case OuterCategory:
                const outerObj: ItemObject = { ...baseObj, outerCategory : category, size };
                const outer = this.outerRepository.create(outerObj);
                await this.outerRepository.save(outer);
                break;
            case PantsCategory:
                const pantsObj: ItemObject = { ...baseObj, pantsCategory : category, size };
                const pants = this.pantsRepository.create(pantsObj);
                await this.pantsRepository.save(pants);
                break;
            case ShoesCategory:
                const shoesObj: ItemObject = { ...baseObj, shoesCategory : category, size };
                const shoes = this.shoesRepository.create(shoesObj);
                await this.shoesRepository.save(shoes);
                break;
            default:
                throw new BadRequestException(`해당하는 카테고리가 존재하지 않습니다. 입력 : ${categoryParent}`);
        }
        return baseObj.code;
    }

    // 상품 업데이트
    async updateItem(itemCode: string, dto: ItemUpdateRequestDto): Promise<ItemSimpleResponseDto> {
        const item = await this.findItemByCode(itemCode);
        await this.itemRepository.update({ id : item.id }, dto);
        return new ItemSimpleResponseDto(item);
    }

    // 상품 삭제
    async softDeleteItem(itemCode: string): Promise<string> {
        const item = await this.findItemByCode(itemCode);
        await this.itemRepository.softDelete({ id : item.id });
        return item.code;
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

interface ItemExtraObject {
    code: string;
    salesCount: number;
}

interface ItemBaseObject extends ItemExtraObject {
    gender: Gender;
    name: string;
    price: number;
    size: string;
    description: string;
    image?: Buffer;
    stockQuantity: number;
    categoryParent: Category;
    categoryChild: string;
}

interface ItemObject extends ItemBaseObject {
    topCategory?: TopCategory;
    outerCategory?: OuterCategory;
    pantsCategory?: PantsCategory;
    shoesCategory?: ShoesCategory;
    size: string;
}