import {Module} from '@nestjs/common';
import {OrdersController} from './controller/orders.controller';
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
import {User} from "../users/user.entity";
import {ItemsController} from "./controller/items.controller";
import {PassportModule} from "@nestjs/passport";

@Module({
    imports : [
        TypeOrmModule.forFeature([Order, OrderItem, Item, Delivery, User]),
        TypeOrmCustomModule.forCustomRepository([
            OrderRepository,
            OrderItemRepository,
            ItemRepository,
            DeliveryRepository
        ]),
        PassportModule.register({ defaultStrategy : 'jwt' })
    ],
    controllers : [OrdersController, ItemsController],
    providers : [OrdersService],
    exports : []
})
export class OrdersModule {}