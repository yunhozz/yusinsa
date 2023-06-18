import {Module} from '@nestjs/common';
import {OrdersController} from './orders.controller';
import {OrdersService} from './orders.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Order} from "./entity/order.entity";
import {OrderItem} from "./entity/order-item.entity";
import {Item} from "./entity/item.entity";
import {Delivery} from "./entity/delivery.entity";
import {TypeOrmCustomModule} from "../config/type-orm.custom.module";
import {OrderRepository} from "./repository/order.repository";
import {OrderItemRepository} from "./repository/order-item.repository";
import {ItemRepository} from "./repository/item.repository";
import {DeliveryRepository} from "./repository/delivery.repository";

@Module({
    imports : [
        TypeOrmModule.forFeature([Order, OrderItem, Item, Delivery]),
        TypeOrmCustomModule.forCustomRepository([
            OrderRepository,
            OrderItemRepository,
            ItemRepository,
            DeliveryRepository
        ]),
    ],
    controllers : [OrdersController],
    providers : [OrdersService],
    exports : []
})
export class OrdersModule {}