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
    UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Gender } from '../order.enum';
import { CATEGORIES } from '../../common/type/categories.type';

@Entity()
@TableInheritance({ column : {
        type : 'varchar',
        name : 'type'
    }
})
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ comment : '상품 식별 코드 (uuid)' })
    code: string;

    @Column({ comment : '상품 성별', type : 'enum', enum : Gender })
    gender: Gender;

    @Column({ comment : '상품 이름' })
    name: string;

    @Column({ comment : '상품 사이즈' })
    size: string;

    @Column({ comment : '상품 가격' })
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

@ChildEntity('T')
export class Top extends Item {
    @Column({ comment : '상의 카테고리', type : 'enum', enum : CATEGORIES.TOP })
    topCategory: typeof CATEGORIES.TOP;
}

@ChildEntity('O')
export class Outer extends Item {
    @Column({ comment : '아우터 카테고리', type : 'enum', enum : CATEGORIES.OUTER })
    outerCategory: typeof CATEGORIES.OUTER;
}

@ChildEntity('P')
export class Pants extends Item {
    @Column({ comment : '바지 카테고리', type : 'enum', enum : CATEGORIES.PANTS })
    pantsCategory: typeof CATEGORIES.PANTS;
}

@ChildEntity('S')
export class Shoes extends Item {
    @Column({ comment : '신발 카테고리', type : 'enum', enum : CATEGORIES.SHOES })
    shoesCategory: typeof CATEGORIES.SHOES;
}