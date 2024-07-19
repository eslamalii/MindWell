import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { Response } from 'express';
import { BypassGuard } from '../common/decorators/bypass-guard.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/signup')
  @UsePipes(ValidationPipe)
  @BypassGuard()
  async signup(@Body() body: CreateUserDto, @Res() res: Response) {
    const user = await this.userService.create(body, res);
    return res.status(HttpStatus.CREATED).json(user);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getProfile(@Query('user_id') userId: number) {
    return await this.userService.findOne(userId);
  }
}
