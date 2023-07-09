import {Address} from "../../common/element/address.interface";
import {OrderStatus} from "../entity/order.enum";
import {Order} from "../entity/order.entity";
import {OrderItem} from "../entity/order-item.entity";
import {Item} from "../entity/item.entity";

export class OrderResponseDto {
    code: string;
    totalPrice: number;
    address: Address;
    status: OrderStatus;
    updatedAt: Date;
    orderItems: OrderItemResponseDto[];

    constructor(order: Order, orderItems: OrderItemResponseDto[]) {
        this.code = order.code;
        this.totalPrice = order.totalPrice;
        this.address = order.address;
        this.status = order.status;
        this.updatedAt = order.updatedAt;
        this.orderItems = orderItems;
    }
}

export class OrderItemResponseDto {
    orderCount: number;
    createdAt: Date;
    itemInfo: ItemResponseDto;

    constructor(orderItem: OrderItem, itemInfo: ItemResponseDto) {
        this.orderCount = orderItem.orderCount;
        this.createdAt = orderItem.createdAt;
        this.itemInfo = itemInfo;
    }
}

export class ItemResponseDto {
    code: string;
    name: string;
    size: string;
    price: number;

    constructor(item: Item) {
        this.code = item.code;
        this.name = item.name;
        this.size = item.size;
        this.price = item.price;
    }
}

export class CartResponseDto {
    order: string;
    item: string;
    count: number;

    constructor(order: string, item: string, count: number) {
        this.order = order;
        this.item = item;
        this.count = count;
    }
}