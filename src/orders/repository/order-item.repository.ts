import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { OrderItem } from '../entity/order-item.entity';

@CustomRepository(OrderItem)
export class OrderItemRepository extends Repository<OrderItem> { }