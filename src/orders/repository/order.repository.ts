import { Brackets, Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Order } from '../entity/order.entity';
import { OrderStatus } from '../order.enum';

@CustomRepository(Order)
export class OrderRepository extends Repository<Order> {
    selectOrdersAndCount(userId: bigint, status: OrderStatus, offset: number, limit: number): Promise<[orders: Order[], count: number]> {
        return this.createQueryBuilder('order')
            .select(['order.code', 'order.totalPrice', 'order.status'])
            .innerJoin('order.user', 'user')
            .where('user.id = :userId', { userId })
            .andWhere(new Brackets(qb => {
                if (status != OrderStatus.WHOLE) {
                    qb.where('order.status = :status', { status });
                }
                qb.andWhere('order.status != :status', { status: OrderStatus.READY });
            }))
            .offset(offset)
            .limit(limit)
            .orderBy('order.id', 'DESC')
            .getManyAndCount();
    }

    selectOrderByOrderCode(orderCode: string): Promise<Order> {
        return this.createQueryBuilder('order')
            .select(['order.code', 'order.totalPrice', 'order.address', 'order.status', 'order.updatedAt', 'delivery.status'])
            .innerJoin('order.delivery', 'delivery')
            .where('order.code = :orderCode', { orderCode })
            .getOneOrFail();
    }

    selectOrderIdAndCodeByOrderCode(orderCode: string): Promise<Order> {
        return this.createQueryBuilder('order')
            .select(['order.id', 'order.code'])
            .innerJoin('order.delivery', 'delivery')
            .where('order.code = :orderCode', { orderCode })
            .andWhere('order.status != :status', { status: OrderStatus.COMPLETE })
            .getOneOrFail();
    }
}