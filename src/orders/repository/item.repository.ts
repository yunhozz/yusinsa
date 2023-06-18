import {CustomRepository} from "../../common/decorator/custom-repository.decorator";
import {Item} from "../entity/item.entity";
import {Repository} from "typeorm";

@CustomRepository(Item)
export class ItemRepository extends Repository<Item> {}