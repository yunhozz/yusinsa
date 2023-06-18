import {CustomRepository} from "../../common/decorator/custom-repository.decorator";
import {Order} from "../entity/order.entity";
import {Repository} from "typeorm";

@CustomRepository(Order)
export class OrderRepository extends Repository<Order> {}