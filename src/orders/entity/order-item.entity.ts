import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Item } from './item.entity';

@Entity()
export class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @ManyToOne(() => Order, order => order.orderItems)
    order: Order;

    @ManyToOne(() => Item, item => item.orderItems)
    item: Item;

    @Column({ comment : '주문 수량' })
    orderCount: number;

    @CreateDateColumn({ comment : '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment : '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment : '삭제 일자', nullable : true })
    deletedAt!: Date | null;
}