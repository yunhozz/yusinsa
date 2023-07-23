import { OrderItem } from './entity/order-item.entity';
import { CATEGORIES, Gender, OuterCategory, PantsCategory, ShoesCategory, TopCategory } from './order.enum';

export type Category = keyof typeof CATEGORIES; // 'TOP' | 'OUTER' | 'PANTS' | 'SHOES'

export type CategoryEnum = typeof CATEGORIES[Category]; // TopCategory | OuterCategory | PantsCategory | ShoesCategory

export interface Address {
    si: string;
    gu: string;
    dong: string;
    etc: string;
}

export interface TopItem {
    topCategory: TopCategory;
    size: string;
}

export interface OuterItem {
    outerCategory: OuterCategory;
    size: string;
}

export interface PantsItem {
    pantsCategory: PantsCategory;
    size: string;
}

export interface ShoesItem {
    shoesCategory: ShoesCategory;
    size: string;
}

export interface OrderItemMap {
    orderItem: OrderItem;
    itemId: bigint;
}

export interface ItemExtraObject {
    code: string;
    salesCount: number;
}

export interface ItemBaseObject extends ItemExtraObject {
    gender: Gender;
    name: string;
    price: number;
    size: string;
    description: string;
    image?: Buffer;
    stockQuantity: number;
    categoryParent: Category;
    categoryChild: string;
}

export interface ItemObject extends ItemBaseObject {
    topCategory?: TopCategory;
    outerCategory?: OuterCategory;
    pantsCategory?: PantsCategory;
    shoesCategory?: ShoesCategory;
    size: string;
}