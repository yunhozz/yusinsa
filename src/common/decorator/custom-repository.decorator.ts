import {SetMetadata} from "@nestjs/common";

export const CUSTOM_REPOSITORY = 'custom_repository';

export const CustomRepository = (entity: Function): ClassDecorator => SetMetadata(CUSTOM_REPOSITORY, entity);