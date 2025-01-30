import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';




@Controller()
export class AppController {


  constructor(private readonly appService: AppService) { }


  @Get('/')
  getApp() {
    return {
      message: 'Hello World!'
    }
  }

  @Get('/public')
  getPublic() {
  //  console.log("API REQUEST COMING")
    return { message: 'Public endpoint accessed.' };
  }

  @Get('/protected')
  @UseGuards(AuthGuard)
  getProtected(@Req() req: Request) {
    return { message: 'Protected endpoint accessed.', user: req['user'] };
  }
}
