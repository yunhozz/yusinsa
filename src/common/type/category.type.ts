import { CATEGORIES } from '../../orders/order.enum';

export type Category = keyof typeof CATEGORIES; // 'TOP' | 'OUTER' | 'PANTS' | 'SHOES'

export type CategoryEnum = typeof CATEGORIES[Category]; // TopCategory | OuterCategory | PantsCategory | ShoesCategory