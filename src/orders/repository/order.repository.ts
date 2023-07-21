import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Order } from '../entity/order.entity';

@CustomRepository(Order)
export class OrderRepository extends Repository<Order> { }