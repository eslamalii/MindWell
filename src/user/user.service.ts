import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Connection } from 'typeorm';
import { EGYPTIAN_CITIES } from './constants/egyptian-cities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly geoService: GeocodingService,
    private readonly jwtService: JwtService,
    private connection: Connection,
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
  async create(body: CreateUserDto): Promise<{ user: User; token: string }> {
    const { name, email, latitude, longitude } = body;

    // Check if email exists
    const isExists = await this.userRepo.findOne({ where: { email } });
    if (isExists)
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    // Validate location and get city
    const locationInfo = await this.geoService.reverseGeocode(
      latitude,
      longitude,
    );
    await this.validateLocation(latitude, longitude);

    // Use transaction for database operations
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUser = this.userRepo.create({
        name,
        email,
        latitude,
        longitude,
        city: locationInfo.city,
      });

      const savedUser = await queryRunner.manager.save(newUser);

      // Generate JWT token
      const token = this.jwtService.sign(
        { userId: savedUser.id },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      );

      await queryRunner.commitTransaction();
      return { user: savedUser, token };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateLocation(latitude: number, longitude: number): Promise<void> {
    const locationInfo = await this.geoService.reverseGeocode(
      latitude,
      longitude,
    );

    const country = locationInfo.country;
    if (country !== 'Egypt') {
      throw new HttpException(
        'User location must be within Egypt.',
        HttpStatus.FORBIDDEN,
      );
    }

    const city = locationInfo.city;
    if (!EGYPTIAN_CITIES.includes(city)) {
      throw new HttpException('City not supported', HttpStatus.BAD_REQUEST);
    }
  }
}
