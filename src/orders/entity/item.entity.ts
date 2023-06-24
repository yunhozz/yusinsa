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
import {CATEGORIES, Gender} from "./category.enum";

// 각 value 를 상수 타입으로 사용 (Const Assertions + Discriminated Union)
type Category = typeof CATEGORIES[keyof typeof CATEGORIES];
// type Category = TopCategory | OuterCategory | PantsCategory | ShoesCategory;

/*
typeof : 객체 데이터를 객체 타입으로 변환해주는 연산자
keyof : 객체 형태의 타입을 따로 속성들만 뽑아 모아 유니온 타입으로 만들어주는 연산자
 */

interface ItemInfo {
    category: Category;
    attribute: object;
}

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
export class Top extends Item implements ItemInfo {
    category: typeof CATEGORIES.TOP;
    attribute: {
        gender: Gender;
        size: string;
    }
}

@ChildEntity()
export class Outer extends Item implements ItemInfo {
    category: typeof CATEGORIES.OUTER;
    attribute: {
        gender: Gender;
        size: string;
    }
}

@ChildEntity()
export class Pants extends Item implements ItemInfo {
    category: typeof CATEGORIES.PANTS;
    attribute: {
        gender: Gender;
        size: number;
    }
}

@ChildEntity()
export class Shoes extends Item implements ItemInfo {
    category: typeof CATEGORIES.SHOES;
    attribute: {
        gender: Gender;
        size: number;
    }
}