import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmCustomModule } from '../config/typeorm/type-orm.custom.module';
import { User } from '../users/user.entity';
import { ItemsController } from './controller/items.controller';
import { OrdersController } from './controller/orders.controller';
import { Item, Outer, Pants, Shoes, Top } from './entity/item.entity';
import { OrderItem } from './entity/order-item.entity';
import { Order } from './entity/order.entity';
import { ItemRepository } from './repository/item.repository';
import { OrderItemRepository } from './repository/order-item.repository';
import { OrderRepository } from './repository/order.repository';
import { ItemsService } from './service/items.service';
import { OrdersService } from './service/orders.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Order, OrderItem, Item, Top, Outer, Pants, Shoes]),
        TypeOrmCustomModule.forCustomRepository([
            OrderRepository,
            OrderItemRepository,
            ItemRepository
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    controllers: [OrdersController, ItemsController],
    providers: [OrdersService, ItemsService],
    exports: []
})
export class OrdersModule { }