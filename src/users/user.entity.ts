import {
    BaseEntity,
    ChildEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    TableInheritance,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from '../orders/entity/order.entity';
import { Gender, Provider, Role } from './user.enum';
import { Address, LocalUserInfo } from './user.interface';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' }})
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ unique: true, length: 50, comment: '유저 이메일' })
    email: string;

    @Column({ comment: '유저 이름', length: 10 })
    name: string;

    @Column({ comment: '계정 생성 위치', type: 'enum', enum: Provider })
    provider: Provider;

    @Column({ comment: '유저 권한 (ADMIN, USER, GUEST)', type: 'enum', enum: Role, default: Role.GUEST })
    role: Role;

    @OneToMany(() => Order, order => order.user, { lazy: true })
    orders: Order[];

    @CreateDateColumn({ comment: '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ comment: '삭제 일자', nullable: true })
    deletedAt!: Date | null;
}

@ChildEntity('LOCAL')
export class LocalUser extends User implements LocalUserInfo {
    @Column({ comment: '유저 비밀번호' })
    password: string;

    @Column({ comment: '유저 나이' })
    age: number;

    @Column({ comment: '유저 성별', type: 'enum', enum: Gender })
    gender: Gender;

    @Column({ comment: '유저 주소 (시, 구, 동, etc)', type: 'json' })
    address: Address;

    @Column({ comment: '유저 핸드폰 번호' })
    phoneNumber: number;

    getAddress(): string {
        const address = this.address;
        return `${address.si} ${address.gu} ${address.dong} ${address.etc}`;
    }
}

@ChildEntity('SOCIAL')
export class SocialUser extends User { }