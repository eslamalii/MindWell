import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: UserRepository,
    private readonly geoService: GeocodingService,
    private readonly jwtService: JwtService,
  ) {}

  async findOne(id: number): Promise<Pick<User, 'name' | 'email' | 'city'>> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['name', 'email', 'city'],
    });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return savedUser;
  }
}
