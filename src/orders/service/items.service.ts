import { v1 as uuid } from 'uuid';
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ItemRepository } from '../repository/item.repository';
import { Item, Outer, Pants, Shoes, Top } from '../entity/item.entity';
import { Brackets, EntityNotFoundError, Like } from 'typeorm';
import { ItemQueryRequestDto, ItemRequestDto, ItemUpdateRequestDto } from '../dto/item-request.dto';
import { ItemResponseDto, ItemSimpleResponseDto } from '../dto/item-response.dto';
import { Categories, Gender, OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../order.enum';
import { Page } from '../../common/pagination/page';
import { Category } from '../../common/type/category.type';
import { PageRequest } from '../../common/pagination/page-request';
import { InjectRepository } from '@nestjs/typeorm';

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

    async addItem(dto: ItemRequestDto): Promise<string> {
        const { name, categoryParent, categoryChild, size } = dto;
        const exist = await this.itemRepository.exist({ where : { name } });

        if (exist) {
            throw new BadRequestException(`해당 이름을 가진 상품이 이미 존재합니다. name : ${name}`);
        }
        const baseObj = { ...dto, ...{ code : uuid(), salesCount : 0 }};
        const categoryEnum = Categories[categoryParent];
        let category, extraObj;

        switch (categoryEnum.valueOf()) {
            case TopCategory:
                category = TopCategory[categoryChild];
                if (!category) {
                    throw new BadRequestException(`카테고리를 잘못 입력했습니다. 입력 : ${categoryChild}`);
                }
                extraObj = { topCategory : category, topSize : String(size) };
                const top = this.topRepository.create({ ...baseObj, ...extraObj });
                await this.topRepository.save(top);
                break;
            case OuterCategory:
                category = OuterCategory[categoryChild];
                if (!category) {
                    throw new BadRequestException(`카테고리를 잘못 입력했습니다. 입력 : ${categoryChild}`);
                }
                extraObj = { outerCategory : category, outerSize : String(size) };
                const outer = this.outerRepository.create({ ...baseObj, ...extraObj });
                await this.outerRepository.save(outer);
                break;
            case PantsCategory:
                category = PantsCategory[categoryChild];
                if (!category) {
                    throw new BadRequestException(`카테고리를 잘못 입력했습니다. 입력 : ${categoryChild}`);
                }
                extraObj = { pantsCategory : category, pantsSize : Number(size) };
                const pants = this.pantsRepository.create({ ...baseObj, ...extraObj });
                await this.pantsRepository.save(pants);
                break;
            case ShoesCategory:
                category = ShoesCategory[categoryChild];
                if (!category) {
                    throw new BadRequestException(`카테고리를 잘못 입력했습니다. 입력 : ${categoryChild}`);
                }
                extraObj = { shoesCategory : category, shoesSize : Number(size) };
                const shoes = this.shoesRepository.create({ ...baseObj, ...extraObj });
                await this.shoesRepository.save(shoes);
                break;
            default:
                throw new BadRequestException(`해당하는 카테고리가 존재하지 않습니다. 입력 : ${categoryParent}`);
        }
        return baseObj.code;
    }

    async updateItem(itemCode: string, dto: ItemUpdateRequestDto): Promise<string> {
        const item = await this.findItemByCode(itemCode);
        await this.itemRepository.update({ id : item.id }, dto);
        return item.code;
    }

    // TODO : 특정 상품 삭제
    async softDeleteItem(itemCode: string): Promise<string> {
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