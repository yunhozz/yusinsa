import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {OrderItem} from "./order-item.entity";

@Entity()
export abstract class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ comment : '상품 이름' })
    name: string;

    @Column({ comment : '상품 수량' })
    price: number;

    @Column({ comment : '상품 재고' })
    stockQuantity: number;

    @OneToMany(() => OrderItem, orderItems => orderItems.item)
    orderItems: OrderItem[];

    @CreateDateColumn({ comment : '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment : '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment : '삭제 일자', nullable : true })
    deletedAt!: Date | null;
}

@Entity()
export class Shirts extends Item {
    @Column()
    size: string;
}

@Entity()
export class Pants extends Item {
    @Column()
    size: number;
}

@Entity()
export class Shoes extends Item {
    @Column()
    size: number;
}