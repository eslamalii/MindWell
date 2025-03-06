import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/swagger/api-responses.decorator';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Endpoint to sign up a new user.
   * Uses ValidationPipe to validate the request body against CreateUserDto.
   * Applies BypassGuard to allow unauthenticated access to this endpoint.
   * @param body - The request body containing user signup details.
   * @param res - The response object to set cookies and return the response.
   * @returns The created user and sets a JWT token as an HTTP-only cookie.
   */
  @Post('/signup')
  @UsePipes(ValidationPipe)
  @BypassGuard()
  @ApiOperation({
    summary: 'Create a new user account',
    description:
      'Creates a new user with the provided details and returns a JWT token as a cookie',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User signup information including name, email, and location',
  })
  @ApiCommonResponses.userCreated()
  @ApiCommonResponses.emailExists()
  @ApiCommonResponses.locationError()
  async signup(
    @Body() body: CreateUserDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { user, token } = await this.userService.create(body);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  /**
   * Endpoint to get a user's profile.
   * Uses AuthGuard to ensure the request is authenticated.
   * @param userId - The ID of the user to retrieve.
   * @returns The user's profile information.
   */
  @Get()
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Get user profile information',
    description: 'Retrieves the profile information for a specific user by ID',
  })
  @ApiQuery({
    name: 'user_id',
    type: Number,
    required: true,
    description: 'The unique identifier of the user',
  })
  @ApiCommonResponses.userProfile()
  @ApiCommonResponses.userNotFound()
  @ApiBearerAuth('JWT-auth')
  @ApiCookieAuth('token')
  async getProfile(@Query('user_id') userId: number) {
    return await this.userService.findOne(userId);
  }
}
