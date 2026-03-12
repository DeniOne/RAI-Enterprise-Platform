import { Resolver, Query, Mutation, Args, Float } from "@nestjs/graphql";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { RapeseedService } from "./rapeseed.service";
import { Rapeseed } from "./dto/rapeseed.type";
import { CreateRapeseedInput } from "./dto/create-rapeseed.input";
import { UpdateRapeseedInput } from "./dto/update-rapeseed.input";
import { AuthorizedGql } from "../../shared/auth/authorized-gql.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Resolver(() => Rapeseed)
@AuthorizedGql(...PLANNING_READ_ROLES)
export class RapeseedResolver {
  constructor(private readonly rapeseedService: RapeseedService) {}

  @Mutation(() => Rapeseed)
  @Roles(...PLANNING_WRITE_ROLES)
  async createRapeseed(
    @Args("input") input: CreateRapeseedInput,
    @CurrentUser() user: User,
  ): Promise<Rapeseed> {
    if (!user.companyId) {
      throw new Error("User does not belong to a company");
    }
    this.rapeseedService.validateRapeseedParameters(input);
    return this.rapeseedService.create(input, user, user.companyId);
  }

  @Mutation(() => Rapeseed)
  @Roles(...PLANNING_WRITE_ROLES)
  async updateRapeseed(
    @Args("input") input: UpdateRapeseedInput,
    @CurrentUser() user: User,
  ): Promise<Rapeseed> {
    if (!user.companyId) {
      throw new Error("User does not belong to a company");
    }
    this.rapeseedService.validateRapeseedParameters(input);
    return this.rapeseedService.update(input, user, user.companyId);
  }

  @Query(() => [Rapeseed])
  async rapeseeds(@CurrentUser() user: User): Promise<Rapeseed[]> {
    if (!user.companyId) {
      throw new Error("User does not belong to a company");
    }
    return this.rapeseedService.findAll(user.companyId);
  }

  @Query(() => [Rapeseed])
  async rapeseedHistory(
    @Args("name") name: string,
    @CurrentUser() user: User,
  ): Promise<Rapeseed[]> {
    if (!user.companyId) {
      throw new Error("User does not belong to a company");
    }
    return this.rapeseedService.getHistory(name, user.companyId);
  }

  @Query(() => [String])
  async rapeseedVarieties(@CurrentUser() user: User): Promise<string[]> {
    if (!user.companyId) throw new Error("Unauthorized");
    return this.rapeseedService.getRapeseedVarieties(user.companyId);
  }

  @Query(() => Float)
  async calculateOilYield(
    @Args("rapeseedId") rapeseedId: string,
    @Args("area") area: number,
    @CurrentUser() user: User,
  ): Promise<number> {
    if (!user.companyId) throw new Error("Unauthorized");
    return this.rapeseedService.calculateOilYield(
      rapeseedId,
      area,
      user.companyId,
    );
  }
}
