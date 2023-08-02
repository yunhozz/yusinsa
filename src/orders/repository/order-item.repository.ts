import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { OrderItem } from '../entity/order-item.entity';

@CustomRepository(OrderItem)
export class OrderItemRepository extends Repository<OrderItem> {
    selectOrderItemsByOrderCode(orderCode: string): Promise<OrderItem[]> {
        return this.createQueryBuilder('orderItem')
            .select(['orderItem.id', 'orderItem.orderCount', 'orderItem.createdAt', 'item.id'])
            .innerJoin('orderItem.order', 'order')
            .innerJoin('orderItem.item', 'item')
            .where('order.code = :orderCode', { orderCode })
            .orderBy('orderItem.createdAt', 'ASC')
            .getMany();
    }
}