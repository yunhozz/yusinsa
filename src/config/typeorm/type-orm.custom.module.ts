import { CUSTOM_REPOSITORY } from '../../common/decorator/custom-repository.decorator';
import { DataSource, Repository } from 'typeorm';
import { DynamicModule, Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';

export class TypeOrmCustomModule {
    public static forCustomRepository<T extends new (...args: any[]) => any>(repositories: T[]): DynamicModule {
        const providers: Provider[] = [];
        for (const repository of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY, repository);
            if (!entity) {
                continue;
            }
            providers.push({
                inject: [getDataSourceToken()],
                provide: repository,
                useFactory: (dataSource: DataSource): typeof Repository => {
                    const baseRepository = dataSource.getRepository(entity);
                    return new repository(baseRepository.target, baseRepository.manager, baseRepository.queryRunner);
                }
            });
        }

        return {
            providers,
            module: TypeOrmCustomModule,
            exports: providers
        };
    }
}