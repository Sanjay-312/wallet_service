import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllUsers() {
    try {
      const users = await this.userRepository.find({});
      return users;
    } catch (err: any) {
      this.logger.error(
        `getAllUsers failed: ${err?.message || err}`,
        err?.stack || err,
      );
      if (err instanceof BadRequestException) throw err;
      if (err.message && err.message.includes("not found"))
        throw new NotFoundException(err.message);
      throw new InternalServerErrorException("Failed to fetch users");
    }
  }
}
