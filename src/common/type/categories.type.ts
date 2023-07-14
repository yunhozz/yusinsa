import { OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../../orders/order.enum';

export const CATEGORIES = {
    TOP : TopCategory,
    OUTER : OuterCategory,
    PANTS : PantsCategory,
    SHOES : ShoesCategory
} as const;

export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];