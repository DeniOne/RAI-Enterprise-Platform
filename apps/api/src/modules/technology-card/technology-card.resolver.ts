import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { TechnologyCardService } from "./technology-card.service";
import { TechnologyCard } from "./dto/technology-card.type";
import { CreateTechnologyCardInput } from "./dto/create-technology-card.input";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { Season } from "../season/dto/season.type";
import { AuthorizedGql } from "../../shared/auth/authorized-gql.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Resolver(() => TechnologyCard)
@AuthorizedGql(...PLANNING_READ_ROLES)
export class TechnologyCardResolver {
  constructor(private readonly techCardService: TechnologyCardService) {}

  @Mutation(() => TechnologyCard)
  @Roles(...PLANNING_WRITE_ROLES)
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
  @Roles(...PLANNING_WRITE_ROLES)
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
