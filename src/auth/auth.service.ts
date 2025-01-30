import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginUserDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';


@Injectable()
export class AuthService {
    private readonly jwtSecret = process.env.JWTSECERT ?? 'REV9TASKAHMED';
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) { }

    async login(loginUserDto: LoginUserDto): Promise<string> {
        const { userId, password } = loginUserDto

        const user = await this.userModel.findOne({ userId }, { userId: 1, role: 1, password: 1 });

        if (!user) {
            throw new HttpException("User Not Found With This UserID", HttpStatus.NOT_FOUND)
        }

        const check: boolean = await bcrypt.compare(password, user.password);

        if (!check) {
            throw new HttpException("Password Don't Match", HttpStatus.UNAUTHORIZED)
        }

        const token: string = jwt.sign({ ...loginUserDto, role: user.role }, this.jwtSecret, { expiresIn: '7d' });

        return token
    }


    async register(registerUserDto: RegisterUserDto): Promise<User> {

        const { userId, password } = registerUserDto

        const checkUser = await this.userModel.findOne({ userId }).exec()
        if (checkUser) {
            throw new HttpException("UserId Already In Use", HttpStatus.ALREADY_REPORTED)
        }

        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);

        const user = await this.userModel.create({ userId: userId, password: hash, role: "user" })

        if (!user) {
            throw new HttpException("Couldn't Make The User", HttpStatus.NOT_IMPLEMENTED)
        }

        return user
    }
}