import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { TechnologyCardService } from "./technology-card.service";
import { TechnologyCard } from "./dto/technology-card.type";
import { CreateTechnologyCardInput } from "./dto/create-technology-card.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "../../shared/auth/auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { Season } from "../season/dto/season.type";

@Resolver(() => TechnologyCard)
@UseGuards(GqlAuthGuard)
export class TechnologyCardResolver {
  constructor(private readonly techCardService: TechnologyCardService) {}

  @Mutation(() => TechnologyCard)
  async createTechnologyCard(
    @Args("input") input: CreateTechnologyCardInput,
    @CurrentUser() user: User,
  ): Promise<any> {
    return this.techCardService.create(input, user, user.companyId!);
  }

  @Query(() => [TechnologyCard])
  async getTechnologyCards(@CurrentUser() user: User): Promise<any[]> {
    return this.techCardService.findAll(user.companyId!);
  }

  @Query(() => TechnologyCard)
  async getTechnologyCard(
    @Args("id") id: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    return this.techCardService.findOne(id, user.companyId!);
  }

  @Mutation(() => Season)
  async applyTechnologyCardToSeason(
    @Args("seasonId") seasonId: string,
    @Args("cardId") cardId: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    return this.techCardService.applyToSeason(
      seasonId,
      cardId,
      user,
      user.companyId!,
    );
  }
}
