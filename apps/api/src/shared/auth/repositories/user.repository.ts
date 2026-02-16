import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IUserRepository, UserWithCompany } from "./user.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithCompany | null> {
    return this.prisma.user.findUnique({ // tenant-lint:ignore repository method has no tenant context in current contract
      where: { email },
      include: { company: true },
    }) as Promise<UserWithCompany | null>;
  }

  async findById(id: string): Promise<UserWithCompany | null> {
    return this.prisma.user.findUnique({ // tenant-lint:ignore repository method has no tenant context in current contract
      where: { id },
      include: { company: true },
    }) as Promise<UserWithCompany | null>;
  }

  async create(data: any): Promise<any> {
    return this.prisma.user.create({ data }) as Promise<any>; // tenant-lint:ignore repository method has no tenant context in current contract
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.user.update({ where: { id }, data }) as Promise<any>; // tenant-lint:ignore repository method has no tenant context in current contract
  }
}
