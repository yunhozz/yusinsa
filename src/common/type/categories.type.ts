import { OuterCategory, PantsCategory, ShoesCategory, TopCategory } from '../../orders/entity/order.enum';

export const CATEGORIES = {
    TOP : TopCategory,
    OUTER : OuterCategory,
    PANTS : PantsCategory,
    SHOES : ShoesCategory
} as const;