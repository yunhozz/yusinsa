import { OrderItem } from '../../orders/entity/order-item.entity';

export interface OrderItemMap {
    orderItem: OrderItem;
    itemId: bigint;
}