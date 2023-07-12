import { OrderItem } from '../../orders/entity/order-item.entity';
import { OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../../orders/entity/order.enum';

export interface Address {
    si: string;
    gu: string;
    dong: string;
    etc: string;
}

export interface OrderItemMap {
    orderItem: OrderItem;
    itemId: bigint;
}

export const CATEGORIES = {
    TOP : TopCategory,
    OUTER : OuterCategory,
    PANTS : PantsCategory,
    SHOES : ShoesCategory
} as const;