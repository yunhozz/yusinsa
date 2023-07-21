import { CustomRepository } from '../../common/decorator/custom-repository.decorator';
import { Delivery } from '../entity/delivery.entity';
import { Repository } from 'typeorm';

@CustomRepository(Delivery)
export class DeliveryRepository extends Repository<Delivery> { }