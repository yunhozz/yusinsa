import { Gender } from '../order.enum';
import { Item } from '../entity/item.entity';

export class ItemResponseDto {
    code: string;
    gender: Gender;
    name: string;
    price: number;
    description: string;
    image: Buffer;
    stockQuantity: number;
    updatedAt: Date;

    constructor(item: Item) {
        this.code = item.code;
        this.gender = item.gender;
        this.name = item.name;
        this.price = item.price;
        this.description = item.description;
        this.image = item.image;
        this.stockQuantity = item.stockQuantity;
        this.updatedAt = item.updatedAt;
    }
}

export class ItemSimpleResponseDto {
    code: string;
    gender: Gender;
    name: string;
    price: number;
    image: Buffer;

    constructor(item: Item) {
        this.code = item.code;
        this.gender = item.gender;
        this.name = item.name;
        this.price = item.price;
        this.image = item.image;
    }
}