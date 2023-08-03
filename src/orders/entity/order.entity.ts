import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { OrderStatus } from '../order.enum';
import { Address } from '../order.interface';
import { OrderItem } from './order-item.entity';

@Entity()
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @ManyToOne(() => User, user => user.orders)
    user: User;

    @Column({ comment: '주문 식별 코드 (uuid)' })
    code: string;

    @Column({ comment: '주문 총 가격' })
    totalPrice: number;

    @Column({ comment: '주문 주소', type: 'json' })
    address: Address;

    @Column({ comment: '주문 상태', type: 'enum', enum: OrderStatus })
    status: OrderStatus;

    @OneToMany(() => OrderItem, orderItem => orderItem.order)
    orderItems: OrderItem[];

    @CreateDateColumn({ comment: '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment: '삭제 일자', nullable: true })
    deletedAt!: Date | null;
}