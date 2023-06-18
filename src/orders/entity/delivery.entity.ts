import {
    BaseEntity,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Order} from "./order.entity";

@Entity()
export class Delivery extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @OneToOne(() => Order, order => order.delivery)
    order: Order;

    @CreateDateColumn({ comment : '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment : '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment : '삭제 일자', nullable : true })
    deletedAt!: Date | null;
}