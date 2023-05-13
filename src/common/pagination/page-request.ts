import {IsNumber, IsOptional} from "class-validator";

export class PageRequest {

    @IsNumber()
    @IsOptional() // undefined 도 받을 수 있다.
    pageNo?: number | 1;

    @IsNumber()
    @IsOptional()
    pageSize?: number | 10;

    constructor(pageNo: number | 1, pageSize: number | 10) {
        this.pageNo = pageNo;
        this.pageSize = pageSize;
    }

    getOffset(): number {
        if (this.pageNo < 1 || this.pageNo === null || this.pageNo === undefined) {
            this.pageNo = 1;
        }

        if (this.pageSize < 1 || this.pageSize === null || this.pageSize === undefined) {
            this.pageSize = 10;
        }

        return (Number(this.pageNo) - 1) * Number(this.pageSize);
    }

    getLimit(): number {
        if (this.pageSize < 1 || this.pageSize === null || this.pageSize === undefined) {
            this.pageSize = 10;
        }

        return Number(this.pageSize);
    }
}