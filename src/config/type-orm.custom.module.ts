import {DynamicModule, Provider} from "@nestjs/common";
import {CUSTOM_REPOSITORY} from "../common/decorator/custom-repository.decorator";
import {getDataSourceToken} from "@nestjs/typeorm";
import {DataSource, Repository} from "typeorm";

export class TypeOrmCustomModule {
    public static forCustomRepository<T extends new (...args: any[]) => any>(repositories: T[]): DynamicModule {
        const providers: Provider[] = [];
        for (const repository of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY, repository);
            if (!entity)
                continue;

            providers.push({
                inject: [getDataSourceToken()],
                provide: repository,
                useFactory: (dataSource: DataSource): typeof Repository => {
                    const baseRepository: any = dataSource.getRepository(entity);
                    return new repository(baseRepository.target, baseRepository.manager, baseRepository.queryRunner);
                }
            });

            return {
                providers,
                module: TypeOrmCustomModule,
                exports: providers
            };
        }
    }
}