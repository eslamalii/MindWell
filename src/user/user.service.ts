import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly geoService: GeocodingService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Finds a user by their ID and returns selected fields (name, email, city).
   * @param {number} id - The ID of the user to find.
   * @returns {Promise<Pick<User, 'name' | 'email' | 'city'>>} A Promise resolving to an object containing the user's name, email, and city.
   * @throws {HttpException} If the user is not found.
   */
  async findOne(id: number): Promise<Pick<User, 'name' | 'email' | 'city'>> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['name', 'email', 'city'],
    });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

  /**
   * Creates a new user and saves them to the database.
   * Also generates a JWT token and sets it as a cookie in the response.
   * @param {CreateUserDto} body - The data transfer object containing the user creation details.
   * @param {Response} res - The HTTP response object to set the cookie on.
   * @returns {Promise<User>} A Promise resolving to the newly created user entity.
   * @throws {HttpException} If the email already exists or the location is not within Egypt.
   */
  async create(body: CreateUserDto, res: Response): Promise<User> {
    const { name, email, latitude, longitude } = body;

    const isExists = await this.userRepo.find({ where: { email: email } });

    if (isExists.length)
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    const locationInfo = await this.geoService.reverseGeocode(
      latitude,
      longitude,
    );
    const country = locationInfo.items[0]?.address.countryName;
    if (country !== 'Egypt') {
      throw new HttpException(
        'User location must be within Egypt.',
        HttpStatus.FORBIDDEN,
      );
    }

    const city = locationInfo.items[0]?.address.city;

    const newUser = this.userRepo.create({
      name,
      email,
      latitude,
      longitude,
      city,
    });

    const savedUser = await this.userRepo.save(newUser);

    const token = this.jwtService.sign(
      { userId: savedUser.id },
      {
        secret: 'shezlong-task',
        expiresIn: '2h',
      },
    );

    // Set the token as an HTTP-only cookie in the response
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return savedUser;
  }
}
