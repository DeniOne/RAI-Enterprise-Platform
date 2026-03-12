import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { SeasonService } from "./season.service";
import { Season } from "./dto/season.type";
import { CreateSeasonInput } from "./dto/create-season.input";
import { UpdateSeasonInput } from "./dto/update-season.input";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { AuthorizedGql } from "../../shared/auth/authorized-gql.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Resolver(() => Season)
@AuthorizedGql(...PLANNING_READ_ROLES)
export class SeasonResolver {
  constructor(private readonly seasonService: SeasonService) {}

  @Mutation(() => Season)
  @Roles(...PLANNING_WRITE_ROLES)
  async createSeason(
    @Args("input") input: CreateSeasonInput,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.create(input, user, user.companyId!);
  }

  @Mutation(() => Season)
  @Roles(...PLANNING_WRITE_ROLES)
  async updateSeason(
    @Args("input") input: UpdateSeasonInput,
    @CurrentUser() user: User,
  ): Promise<Season> {
    return this.seasonService.update(input, user, user.companyId!);
  }

  @Mutation(() => Season)
  @Roles(...PLANNING_WRITE_ROLES)
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
  @Roles(...PLANNING_WRITE_ROLES)
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
