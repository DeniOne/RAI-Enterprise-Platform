import { User, Prisma } from "@prisma/client";

export type UserWithCompany = Prisma.UserGetPayload<{
  include: { company: true };
}>;

export interface IUserRepository {
  findByEmail(email: string): Promise<UserWithCompany | null>;
  findById(id: string): Promise<UserWithCompany | null>;
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
}
