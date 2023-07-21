import { Gender, OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../order.enum';
import { OrderItem } from './order-item.entity';
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

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ comment: '상품 식별 코드 (uuid)' })
    code: string;

    @Column({ comment: '상품 성별', type: 'enum', enum: Gender })
    gender: Gender;

    @Column({ comment: '상품 이름', unique: true })
    name: string;

    @Column({ comment: '상품 가격' })
    price: number;

    @Column({ comment: '상품 사이즈' })
    size: string;

    @Column({ comment: '상품 상세 설명', length: 2000 })
    description: string;

    @Column({ comment: '상품 이미지', type: 'blob', nullable: true })
    image?: Buffer;

    @Column({ comment: '상품 판매량' })
    salesCount: number;

    @Column({ comment: '상품 재고' })
    stockQuantity: number;

    @OneToMany(() => OrderItem, orderItems => orderItems.item)
    orderItems: OrderItem[];

    @CreateDateColumn({ comment: '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment: '삭제 일자', nullable: true })
    deletedAt!: Date | null;
}

@ChildEntity('TOP')
export class Top extends Item implements TopItem {
    @Column({ comment: '상의 카테고리', type: 'enum', enum: TopCategory })
    topCategory: TopCategory;

    @Column({ comment: '상의 사이즈' })
    size: string;
}

@ChildEntity('OUTER')
export class Outer extends Item implements OuterItem {
    @Column({ comment: '아우터 카테고리', type: 'enum', enum: OuterCategory })
    outerCategory: OuterCategory;

    @Column({ comment: '아우터 사이즈' })
    size: string;
}

@ChildEntity('PANTS')
export class Pants extends Item implements PantsItem {
    @Column({ comment: '하의 카테고리', type: 'enum', enum: PantsCategory })
    pantsCategory: PantsCategory;

    @Column({ comment: '하의 사이즈' })
    size: string;
}

@ChildEntity('SHOES')
export class Shoes extends Item implements ShoesItem {
    @Column({ comment: '신발 카테고리', type: 'enum', enum: ShoesCategory })
    shoesCategory: ShoesCategory;

    @Column({ comment: '신발 사이즈' })
    size: string;
}

interface TopItem {
    topCategory: TopCategory;
    size: string;
}

interface OuterItem {
    outerCategory: OuterCategory;
    size: string;
}

interface PantsItem {
    pantsCategory: PantsCategory;
    size: string;
}

interface ShoesItem {
    shoesCategory: ShoesCategory;
    size: string;
}