import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getLandingPage(@Res() res: Response): void {
    res.type('html').send(this.appService.getLandingPage());
  }
}
