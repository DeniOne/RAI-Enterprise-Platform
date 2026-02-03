import { Resolver, Query, Mutation, Args, Float } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "../../shared/auth/auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@prisma/client";
import { RapeseedService } from "./rapeseed.service";
import { Rapeseed } from "./dto/rapeseed.type";
import { CreateRapeseedInput } from "./dto/create-rapeseed.input";
import { UpdateRapeseedInput } from "./dto/update-rapeseed.input";

@Resolver(() => Rapeseed)
@UseGuards(GqlAuthGuard)
export class RapeseedResolver {
  constructor(private readonly rapeseedService: RapeseedService) {}

  @Mutation(() => Rapeseed)
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
