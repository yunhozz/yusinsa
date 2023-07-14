import { v1 as uuid } from 'uuid';
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entity/order.entity';
import { OrderItemRepository } from '../repository/order-item.repository';
import { ItemRepository } from '../repository/item.repository';
import { OrderItem } from '../entity/order-item.entity';
import { Item } from '../entity/item.entity';
import { User } from '../../users/user.entity';
import { UserRepository } from '../../users/user.repository';
import { Brackets, EntityNotFoundError, Equal, Not } from 'typeorm';
import { Page } from '../../common/pagination/page';
import { PageRequest } from '../../common/pagination/page-request';
import { OrderItemRequestDto, OrderRequestDto } from '../dto/order-request.dto';
import { OrderStatus } from '../order.enum';
import { CartResponseDto, ItemResponseDto, OrderItemResponseDto, OrderResponseDto } from '../dto/order-response.dto';
import { OrderItemMap } from '../../common/type/order-item-map.type';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository,
        @InjectRepository(Order)
        private readonly orderRepository: OrderRepository,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: OrderItemRepository,
        @InjectRepository(Item)
        private readonly itemRepository: ItemRepository
    ) {}

    private readonly logger = new Logger(OrdersService.name);

    // 주문 내역 조회
    async findOrdersByUserId(userId: bigint, page: PageRequest, status: OrderStatus): Promise<Page<Order>> {
        const [orders, count] = await this.orderRepository.createQueryBuilder('order')
            .select(['order.code', 'order.totalPrice', 'order.status'])
            .innerJoin('order.user', 'user')
            .where('user.id = :userId', { userId })
            .andWhere(new Brackets(qb => {
                if (status != OrderStatus.WHOLE) {
                    qb.where('order.status = :status', { status });
                }
                qb.andWhere('order.status != :status', { status : OrderStatus.READY });
            }))
            .offset(page.getOffset())
            .limit(page.getLimit())
            .orderBy('order.id', 'DESC')
            .getManyAndCount();

        return new Page(page.pageSize, count, orders);
    }

    // 주문 내역 상세 조회
    async findOrderDetails(orderCode: string): Promise<OrderResponseDto> {
        const orderItems = await this.orderItemRepository.createQueryBuilder('orderItem')
            .select(['item.id', 'orderItem.id', 'orderItem.orderCount', 'orderItem.createdAt'])
            .innerJoin('orderItem.order', 'order')
            .innerJoin('orderItem.item', 'item')
            .where('order.code = :orderCode', { orderCode })
            .orderBy('orderItem.createdAt', 'ASC')
            .getMany();

        const order = await this.orderRepository.createQueryBuilder('order')
            .select(['order.code', 'order.totalPrice', 'order.address', 'order.status', 'order.updatedAt'])
            .where('order.code = :orderCode', { orderCode })
            .getOneOrFail()
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 주문 건을 찾을 수 없습니다. Order Code : ${orderCode}`);
                } else {
                    throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });

        const map: OrderItemMap[] = orderItems.map(oi => ({ orderItem : oi, itemId : oi.item.id }));
        const orderItemResponseDtoList: OrderItemResponseDto[] = [];

        for (const { orderItem, itemId } of map) {
            const item = await this.itemRepository.createQueryBuilder('item')
                .select(['item.code', 'item.name', 'item.size', 'item.price', 'item.image'])
                .where('item.id = :itemId', { itemId })
                .getOneOrFail()
                .catch(e => {
                    if (e instanceof EntityNotFoundError) {
                        throw new NotFoundException(`해당 상품을 찾을 수 없습니다. Item ID : ${itemId}`);
                    } else {
                        throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                });

            const itemInfo = new ItemResponseDto(item);
            const orderItemResponseDto = new OrderItemResponseDto(orderItem, itemInfo);
            orderItemResponseDtoList.push(orderItemResponseDto);
        }
        return new OrderResponseDto(order, orderItemResponseDtoList);
    }

    // 장바구니에 상품 추가
    async addOrderHistory(userId: bigint, dto: OrderItemRequestDto): Promise<CartResponseDto> {
        const { itemCode, size, count } = dto;
        const user = await this.userRepository.findOneBy({ id : userId });
        const item = await this.itemRepository.findOneByOrFail({ code : itemCode, size })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 상품을 찾을 수 없습니다. Item Code : ${itemCode}`);
                } else {
                    throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });

        const orderItem = await this.orderItemRepository.create({
            order : null,
            item,
            orderCount : count
        });

        let order;
        const findOrder = await this.orderRepository.findOneBy({
            user : Equal(user.id),
            status : OrderStatus.READY
        });

        if (findOrder) {
            orderItem.order = findOrder;
        } else {
            order = await this.orderRepository.create({
                user,
                code : uuid(),
                totalPrice : 0,
                address : {},
                status : OrderStatus.READY,
                orderItems : [orderItem]
            });
            orderItem.order = order;
            await this.orderRepository.save(order);
        }
        await this.orderItemRepository.save(orderItem);
        return new CartResponseDto(orderItem.order.code, orderItem.item.code, orderItem.orderCount);
    }

    // 주문 완료 시 주문 상태 변경, 장바구니 삭제
    async makeOrderFromCartItems(dto: OrderRequestDto): Promise<string> {
        const { cart, si, gu, dong, etc } = dto;
        const order = await this.orderRepository.findOneByOrFail({
            code : cart[0].orderCode,
            status : OrderStatus.READY
        }).catch(e => {
            if (e instanceof EntityNotFoundError) {
                throw new NotFoundException(`장바구니가 비어있거나 해당 주문 건이 이미 진행되었습니다.`);
            } else {
                throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });

        const quantities = new Map<bigint, number[]>();
        let resultPrice = 0;

        for (const c of cart) {
            const item = await this.findItemByCode(c.itemCode);
            const salesCount = item.salesCount + c.count;
            const remainQuantity = item.stockQuantity - c.count;

            if (remainQuantity < 0) {
                this.logger.error('상품 재고 부족!!');
                throw new BadRequestException(`상품 재고 부족. 이름 : ${item.name}, 재고 : ${item.stockQuantity}, 주문 수량 : ${c.count}`);
            }
            resultPrice += item.price * c.count;
            quantities.set(item.id, [salesCount, remainQuantity]);
        }
        for (const [itemId, arr] of quantities.entries()) {
            await this.itemRepository.update({ id : itemId }, { salesCount : arr[0], stockQuantity : arr[1] });
        }
        await this.orderRepository.update({ id : order.id }, {
            totalPrice : resultPrice,
            address : { si, gu, dong, etc },
            status : OrderStatus.DONE
        });
        return order.code;
    }

    // 장바구니 단건 취소
    async deleteOrderItemByCodeAndCount(orderCode: string, itemCode: string, count: number): Promise<string> {
        const order = await this.findOrderByCode(orderCode);
        const item = await this.findItemByCode(itemCode);
        await this.orderItemRepository.softDelete({ order : Equal(order.id), item : Equal(item.id), orderCount : count });
        return item.code;
    }

    // 주문 일괄 취소
    async changeStatusCancelAndDeleteOrder(orderCode: string): Promise<string> {
        const order = await this.orderRepository.findOneByOrFail({
            code : orderCode,
            status : Not(OrderStatus.COMPLETE)
        }).catch(e => {
            if (e instanceof EntityNotFoundError) {
                throw new NotFoundException(`해당 주문건이 이미 진행 중입니다. Order Code : ${orderCode}`);
            } else {
                throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });

        const orderItems = await this.orderItemRepository.find({
            relations : { order : true },
            where : { order : Equal(order.id) }
        });

        for (const orderItem of orderItems) {
            const item = orderItem.item;
            const orderCount = orderItem.orderCount;
            await this.itemRepository.update({ id : item.id }, { stockQuantity : item.stockQuantity + orderCount });
            await this.orderItemRepository.softDelete({ id : orderItem.id });
        }
        await this.orderRepository.update({ id : order.id }, { status : OrderStatus.CANCEL });
        return order.code;
    }

    private async findOrderByCode(code: string): Promise<Order> {
        return await this.orderRepository.findOneByOrFail({ code })
            .catch(e => {
                if (e instanceof EntityNotFoundError) {
                    throw new NotFoundException(`해당 주문 건을 찾을 수 없습니다. Order Code : ${code}`);
                } else {
                    throw new HttpException(e.message(), HttpStatus.INTERNAL_SERVER_ERROR);
                }
            });
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