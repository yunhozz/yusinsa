import { Module } from '@nestjs/common';
import { OrdersController } from './controller/orders.controller';
import { OrdersService } from './service/orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { Item, Outer, Pants, Shoes, Top } from './entity/item.entity';
import { Delivery } from './entity/delivery.entity';
import { TypeOrmCustomModule } from '../config/typeorm/type-orm.custom.module';
import { OrderRepository } from './repository/order.repository';
import { OrderItemRepository } from './repository/order-item.repository';
import { ItemRepository } from './repository/item.repository';
import { DeliveryRepository } from './repository/delivery.repository';
import { User } from '../users/user.entity';
import { ItemsController } from './controller/items.controller';
import { PassportModule } from '@nestjs/passport';
import { ItemsService } from './service/items.service';

@Module({
    imports : [
        TypeOrmModule.forFeature([User, Order, OrderItem, Item, Top, Outer, Pants, Shoes, Delivery]),
        TypeOrmCustomModule.forCustomRepository([
            OrderRepository,
            OrderItemRepository,
            ItemRepository,
            DeliveryRepository
        ]),
        PassportModule.register({ defaultStrategy : 'jwt' })
    ],
    controllers : [OrdersController, ItemsController],
    providers : [OrdersService, ItemsService],
    exports : []
})
export class OrdersModule {}