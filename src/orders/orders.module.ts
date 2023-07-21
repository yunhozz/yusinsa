import { Delivery } from './entity/delivery.entity';
import { DeliveryRepository } from './repository/delivery.repository';
import { Item, Outer, Pants, Shoes, Top } from './entity/item.entity';
import { ItemRepository } from './repository/item.repository';
import { ItemsController } from './controller/items.controller';
import { ItemsService } from './service/items.service';
import { Module } from '@nestjs/common';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { OrderItemRepository } from './repository/order-item.repository';
import { OrderRepository } from './repository/order.repository';
import { OrdersController } from './controller/orders.controller';
import { OrdersService } from './service/orders.service';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmCustomModule } from '../config/typeorm/type-orm.custom.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Order, OrderItem, Item, Top, Outer, Pants, Shoes, Delivery]),
        TypeOrmCustomModule.forCustomRepository([
            OrderRepository,
            OrderItemRepository,
            ItemRepository,
            DeliveryRepository
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    controllers: [OrdersController, ItemsController],
    providers: [OrdersService, ItemsService],
    exports: []
})
export class OrdersModule { }