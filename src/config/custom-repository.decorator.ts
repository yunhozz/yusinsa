import {SetMetadata} from "@nestjs/common";

export const CUSTOM_REPOSITORY = 'custom_repository';

export function CustomRepository(entity: Function): ClassDecorator {
    return SetMetadata(CUSTOM_REPOSITORY, entity);
}