import {v1 as uuid} from 'uuid';
import {BadRequestException, Injectable} from '@nestjs/common';
import {OrderRepository} from "./repository/order.repository";
import {InjectRepository} from "@nestjs/typeorm";
import {Order} from "./entity/order.entity";
import {OrderItemRepository} from "./repository/order-item.repository";
import {ItemRepository} from "./repository/item.repository";
import {OrderItem} from "./entity/order-item.entity";
import {Item} from "./entity/item.entity";
import {User} from "../users/user.entity";
import {UserRepository} from "../users/user.repository";
import {Equal, IsNull} from "typeorm";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";
import {OrderRequestDto} from "./dto/order-request.dto";
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

    /*
    유저가 제품의 정보 입력 (사이즈, 수량 등) -> 장바구니 추가 (쿠키 이용) -> 장바구니에서 일괄 구매 -> 유저 정보 입력 (주소, 전화번호, 결제 방식 등)
     */

    // TODO : 주문 상태에 따른 조회 (OrderStatus -> ready, complete, cancel)
    async findOrdersByUserId(userId: bigint, page: PageRequest): Promise<Page<Order>> {
        const user = await this.userRepository.findOneBy({ id: userId });
        const orders = await this.orderRepository.find({
            relations : { user : true },
            where : { user : Equal(user), deletedAt : IsNull() },
            skip : page.getOffset(),
            take : page.getLimit(),
            order : { id : "DESC" }
        });

        const totalCount = await this.orderRepository.countBy({ user : Equal(user) });
        return new Page(page.pageSize, totalCount, orders);
    }

    async makeOrderFromCartItems(userId: bigint, dto: OrderRequestDto): Promise<string> {
        const { cartItems, si, gu, dong, etc } = dto;
        const user = await this.userRepository.findOneBy({ id : userId });
        const order = await this.orderRepository.create({
            user,
            orderCode : uuid(),
            totalPrice : null,
            address : { si, gu, dong, etc },
            status : OrderStatus.READY,
            orderItems : []
        });

        const orderItems: OrderItem[] = [];
        let totalPrice = 0;
        for (const cartItem of cartItems) {
            const item = await this.itemRepository.findOneBy({ code : cartItem.itemCode });
            const remain = item.stockQuantity - cartItem.count;
            if (remain < 0) {
                throw new BadRequestException('해당 상품의 재고가 부족합니다.');
            }

            const orderItem = await this.orderItemRepository.create({
                order,
                item,
                orderCount : cartItem.count,
                address : { si, gu, dong, etc }
            });
            orderItems.push(orderItem);
            totalPrice += item.price * cartItem.count;
            item.stockQuantity = remain;
        }

        order.orderItems = orderItems;
        order.totalPrice = totalPrice;
        await this.orderRepository.save(order);
        await this.orderItemRepository.save(orderItems);

        return order.orderCode;
    }
}