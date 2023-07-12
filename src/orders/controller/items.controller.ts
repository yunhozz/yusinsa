import { Controller, Get, HttpStatus } from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { ApiResponse } from '../../common/response/api-response';

@Controller('/api/items')
export class ItemsController {
    constructor(private readonly orderService: OrdersService) {}

    @Get("/:id")
    async getItemInfo(): Promise<ApiResponse> {
        return ApiResponse.ok(HttpStatus.OK, null);
    }
}