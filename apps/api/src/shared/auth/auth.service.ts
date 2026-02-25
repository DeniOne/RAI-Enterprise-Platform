import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRepository } from "./repositories/user.repository";

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    // Find user by email (ARCH-DEBT-001: include company for multi-tenancy)
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // For demo purposes, we'll skip password hashing
    // In production, use: await bcrypt.compare(password, user.passwordHash)
    // For now, just check if password matches (assuming plain text for demo)
    if (password !== "password123") {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      email: user.email,
      sub: user.id,
      companyId: user.companyId, // ARCH-DEBT-001: from user.companyId (NOT NULL)
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    // Dev mode: возвращаем заглушку без обращения к БД
    if (userId === 'dev-user-00000000') {
      return {
        id: 'dev-user-00000000',
        email: 'dev@local.rai',
        name: 'Dev User',
        role: 'ADMIN',
        companyId: null, // companyId уже есть в req.user, здесь не нужен
      };
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    };
  }

  async listCompanyUsers(companyId: string) {
    const users = await this.userRepository.findByCompanyId(companyId);
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      role: user.role,
      companyId: user.companyId,
    }));
  }
}
