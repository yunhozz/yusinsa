import {
    BaseEntity,
    ChildEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    TableInheritance,
    UpdateDateColumn
} from "typeorm";
import {OrderItem} from "./order-item.entity";

@Entity()
@TableInheritance({ column : {
        type : 'varchar',
        name : 'type'
    }
})
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ comment : '아이템 식별 코드 (uuid)' })
    code: string;

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

@ChildEntity()
export class Shirts extends Item {
    @Column()
    shirtSize: string;
}

@ChildEntity()
export class Pants extends Item {
    @Column()
    pantsSize: number;
}

@ChildEntity()
export class Shoes extends Item {
    @Column()
    shoesSize: number;
}