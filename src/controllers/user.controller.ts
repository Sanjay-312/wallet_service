import { UserService } from "@/services/user.service";
import { Controller, Get } from "@nestjs/common";

@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    const users = await this.userService.getAllUsers();

    return {
      success: true,
      message: 'Userss fethced successfully',
      data: users,
    };
  }
}
