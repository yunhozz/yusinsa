import { SetMetadata } from '@nestjs/common';

export const CUSTOM_REPOSITORY = 'custom_repository';

export const CustomRepository = <T extends new (...args: any[]) => any>(entity: T): ClassDecorator => SetMetadata(CUSTOM_REPOSITORY, entity);