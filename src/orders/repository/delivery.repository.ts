import { Repository } from 'typeorm';
import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Delivery } from '../entity/delivery.entity';

@CustomRepository(Delivery)
export class DeliveryRepository extends Repository<Delivery> { }