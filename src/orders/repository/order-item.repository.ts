import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { OrderItem } from '../entity/order-item.entity';
import { Repository } from 'typeorm';

@CustomRepository(OrderItem)
export class OrderItemRepository extends Repository<OrderItem> { }