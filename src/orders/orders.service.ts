import {v1 as uuid} from 'uuid';
import {Injectable} from '@nestjs/common';
import {OrderRepository} from "./repository/order.repository";
import {InjectRepository} from "@nestjs/typeorm";
import {Order} from "./entity/order.entity";
import {OrderItemRepository} from "./repository/order-item.repository";
import {ItemRepository} from "./repository/item.repository";
import {OrderItem} from "./entity/order-item.entity";
import {Item} from "./entity/item.entity";
import {User} from "../users/user.entity";
import {UserRepository} from "../users/user.repository";
import {OrderRequestDto} from "./dto/order-request.dto";
import {Equal} from "typeorm";
import {Page} from "../common/pagination/page";
import {PageRequest} from "../common/pagination/page-request";

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

    async findOrdersByUserId(userId: bigint, page: PageRequest): Promise<Page<Order>> {
        const user = await this.userRepository.findOneBy({ id: userId });
        const orders = await this.orderRepository.find({
            relations : { user : true },
            where : { user : Equal(user) },
            take : page.getOffset(),
            skip : page.getLimit(),
            order : { id : "DESC" }
        });

        const totalCount = await this.orderRepository.countBy({ user : Equal(user) });
        return new Page(page.pageSize, totalCount, orders);
    }

    async makeItemCodeFromOrder(userId: bigint, itemId: bigint, dto: OrderRequestDto): Promise<string> {
        const user = await this.userRepository.findOneBy({ id : userId });
        const item = await this.itemRepository.findOneBy({ id : itemId });
        const { count, si, gu, dong, etc } = dto;

        const order = await this.orderRepository.create({
            user,
            orderCode : uuid(),
            totalPrice : item.price * count,
            address : { si, gu, dong, etc },
            orderItems : []
        });

        const orderItem = await this.orderItemRepository.create({
            order,
            item,
            orderCount : count,
            address : { si, gu, dong, etc }
        });

        order.orderItems.push(orderItem);
        await this.orderRepository.save(order);
        await this.orderItemRepository.save(orderItem);

        return item.code;
    }

    async makeOrdersByItemCodes(): Promise<any> {

        return null;
    }
}