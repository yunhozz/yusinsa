export interface UserAddress {
    si: string;
    gu: string;
    dong: string;
    etc: string;
    getWholeAddress(...args: string[]): string;
}