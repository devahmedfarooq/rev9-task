import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { LoginUserDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/register.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('/login')
    async login(@Body() loginUserDto: LoginUserDto) {
        const token = await this.authService.login(loginUserDto)
        return {
            token
        }
    }

    @Post('/register')
    async register(@Body() registerUserDto: RegisterUserDto) {
        return await this.authService.register(registerUserDto)
    }

}
