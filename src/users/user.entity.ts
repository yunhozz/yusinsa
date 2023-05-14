import {
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

export interface Address {
    si: string;
    gu: string;
    dong: string;
    etc: string;
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female'
}

export enum Role {
    ADMIN = 'admin',
    USER = 'user'
}

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: bigint;

    @Column({ unique: true, length: 50, comment: '유저 이메일' })
    email: string;

    @Column({ comment: '유저 비밀번호 (salt + bcrypt 로 암호화)' })
    password: string;

    @Column({ length: 10, comment: '유저 이름' })
    name: string;

    @Column({ comment: '유저 나이' })
    age: number;

    @Column({ type: 'enum', enum: Gender, comment: '유저 성별' })
    gender: Gender;

    @Column({ type: 'json', comment: '유저 주소 (시, 구, 동, etc)' })
    address: Address;

    @Column({ comment: '유저 핸드폰 번호' })
    phoneNumber: number;

    @Column({ type: 'enum', enum: Role, comment: '유저 권한 (ADMIN, USER)' })
    roles: Role[];

    @CreateDateColumn({ comment: '생성 일자' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정 일자' })
    updatedAt: Date;

    @DeleteDateColumn({ nullable: true, comment: '삭제 일자' })
    deletedAt!: Date | null;

    updatePassword(password: string): void {
        this.password = password;
    }

    updateProfile(name: string, age: number, gender: Gender, address: Address, phoneNumber: number): void {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.address = address;
        this.phoneNumber = phoneNumber;
    }
}