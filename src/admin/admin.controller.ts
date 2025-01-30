import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { updateRatelimitDto } from './dto/updateRateLimit.dto';
import { AdminService } from './admin.service';




@Controller('admin')
export class AdminController {
    
    constructor(private readonly adminService : AdminService) {}

    @Post('/update-limits')
    @UseGuards(AdminGuard)
    async updateRateLimits(@Body() updateRatelimitDto: updateRatelimitDto) {
        return await this.adminService.updateLimit(updateRatelimitDto)
    }

}
