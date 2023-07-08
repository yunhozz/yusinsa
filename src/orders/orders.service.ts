import {v1 as uuid} from 'uuid';
import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {OrderRepository} from "./repository/order.repository";
import {InjectRepository} from "@nestjs/typeorm";
import {Order} from "./entity/order.entity";
import {OrderItemRepository} from "./repository/order-item.repository";
import {ItemRepository} from "./repository/item.repository";
import {OrderItem} from "./entity/order-item.entity";
import {Item} from "./entity/item.entity";
import {User} from "../users/user.entity";
import {UserRepository} from "../users/user.repository";
import {Brackets, Equal, IsNull, Not} from "typeorm";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";
import {OrderItemRequestDto, OrderRequestDto} from "./dto/order-request.dto";
import {OrderStatus} from "./entity/order.enum";

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
    async findOrdersByUserId(userId: bigint, page: PageRequest, status?: OrderStatus): Promise<Page<Order>> {
        const [orders, count] = await this.orderRepository.createQueryBuilder('order')
            .select(['order.code', 'order.totalPrice', 'order.status'])
            .innerJoin('order', 'user')
            .where('user.id = :userId', { userId })
            .andWhere(new Brackets(qb => {
                const q = 'order.status = :status';
                status ? qb.where(q, { status }) : qb.where(q, { status : Not(null) });
            }))
            .withDeleted()
            .offset(page.getOffset())
            .limit(page.getLimit())
            .orderBy('order.id', 'DESC')
            .getManyAndCount();

        return new Page(page.pageSize, count, orders);
    }

    // TODO
    // 장바구니 내역 조회
    async findCartOrdersByUserId(userId: bigint): Promise<any> {
        const user = await this.userRepository.findOneBy({ id : userId });
        await this.orderItemRepository.find({
            relations : { order : true, item : true },
            where : { deletedAt : IsNull() }
        });
    }

    // 장바구니에 상품 추가
    async addOrderHistory(userId: bigint, dto: OrderItemRequestDto): Promise<{ order: string, item: string, count: number }> {
        const { itemCode, size, count } = dto;
        const user = await this.userRepository.findOneBy({ id : userId });
        const item = await this.itemRepository.findOneBy({ code : itemCode, size });

        const orderItem = await this.orderItemRepository.create({
            order : null,
            item,
            orderCount : count
        });

        let order: Order;
        const findOrder = await this.orderRepository.findOneBy({
            user : Equal(user),
            status : OrderStatus.READY
        });

        if (findOrder) {
            orderItem.order = findOrder;
            const orderItems = findOrder.orderItems;
            orderItems.push(orderItem);
            await this.orderRepository.update({ id : findOrder.id }, { orderItems });
        } else {
            order = await this.orderRepository.create({
                user,
                code : uuid(),
                totalPrice : 0,
                address : null,
                status : OrderStatus.READY,
                orderItems : []
            });
            orderItem.order = order;
            order.orderItems.push(orderItem);
            await this.orderRepository.save(order);
        }
        await this.orderItemRepository.save(orderItem);

        return {
            order : orderItem.order.code,
            item : orderItem.item.code,
            count : orderItem.orderCount
        };
    }

    // 주문 완료 시 주문 상태 변경, 장바구니 삭제
    async makeOrderFromCartItems(userId: bigint, dto: OrderRequestDto): Promise<Order> {
        const { cart, si, gu, dong, etc } = dto;
        const user = await this.userRepository.findOneBy({ id : userId });
        const order = await this.orderRepository.findOneBy({
            user : Equal(user),
            code : cart[0].orderCode,
            status : OrderStatus.READY,
        });

        const quantities = new Map<bigint, number>();
        let resultPrice = 0;

        for (const c of cart) {
            const item = await this.itemRepository.findOneBy({ code : c.itemCode });
            const remainQuantity = item.stockQuantity - c.count;

            if (remainQuantity < 0) {
                this.logger.error('상품 재고 부족!!');
                throw new BadRequestException(`상품 재고 부족. 이름 : ${item.name}, 재고 : ${item.stockQuantity}, 주문 수량 : ${c.count}`);
            }
            resultPrice += item.price * c.count;
            quantities.set(item.id, remainQuantity);
        }
        for (const [itemId, quantity] of quantities.entries()) {
            await this.itemRepository.update({ id : itemId }, { stockQuantity : quantity });
        }
        await this.orderRepository.update({ id : order.id }, {
            totalPrice : resultPrice,
            address : { si, gu, dong, etc },
            status : OrderStatus.DONE
        });

        await this.orderItemRepository.softDelete({ order : Equal(order) });
        return order;
    }

    // TODO
    // 장바구니 내 아이템 단건 취소
    async deleteCartItem(orderCode: string, itemCode: string): Promise<any> {

    }

    // TODO
    // 주문 일괄 취소
    async changeStatusCancelAndDeleteOrder(orderCode: string): Promise<string> {
        await this.orderRepository.update({ code : orderCode, status : Not(OrderStatus.CANCEL) }, { status : OrderStatus.CANCEL })
            .catch(e => {
                this.logger.error(e.message);
                throw new NotFoundException(`해당 주문 건을 찾을 수 없습니다. order code : ${orderCode}`);
            });

        await this.orderRepository.softDelete({ code : orderCode });
        return orderCode;
    }
}