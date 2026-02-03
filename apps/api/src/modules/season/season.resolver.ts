import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { SeasonService } from "./season.service";
import { Season } from "./dto/season.type";
import { CreateSeasonInput } from "./dto/create-season.input";
import { UpdateSeasonInput } from "./dto/update-season.input";
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "../../shared/auth/auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@prisma/client";

@Resolver(() => Season)
@UseGuards(GqlAuthGuard)
export class SeasonResolver {
  constructor(private readonly seasonService: SeasonService) {}

  @Mutation(() => Season)
  async createSeason(
    @Args("input") input: CreateSeasonInput,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.create(input, user, user.companyId!);
  }

  @Mutation(() => Season)
  async updateSeason(
    @Args("input") input: UpdateSeasonInput,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.update(input, user, user.companyId!);
  }

  @Mutation(() => Season)
  async completeSeason(
    @Args("id") id: string,
    @Args("actualYield") actualYield: number,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.completeSeason(
      id,
      actualYield,
      user,
      user.companyId!,
    );
  }

  @Query(() => [Season])
  async getSeasons(@CurrentUser() user: User): Promise<Season[]> {
    return this.seasonService.findAll(user.companyId!);
  }

  @Query(() => Season)
  async getSeason(
    @Args("id") id: string,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.findOne(id, user.companyId!);
  }

  @Mutation(() => Season)
  async transitionSeasonStage(
    @Args("seasonId") seasonId: string,
    @Args("targetStageId") targetStageId: string,
    @Args("metadata", { nullable: true }) metadata?: string,
    @CurrentUser() user?: User,
  ): Promise<Season> {
    return this.seasonService.transitionStage(
      seasonId,
      targetStageId,
      metadata ? JSON.parse(metadata) : {},
      user!,
      user!.companyId!,
    );
  }
}
