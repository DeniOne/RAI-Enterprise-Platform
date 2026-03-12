import { Resolver, Mutation, Args } from "@nestjs/graphql";
import { TaskService } from "./task.service";
import { Task } from "./types/task.type";
import { CreateTasksFromSeasonInput } from "./dto/create-tasks.input";
import { TaskResourceActualInput } from "./dto/task-resource.input";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { AuthorizedGql } from "../../shared/auth/authorized-gql.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  EXECUTION_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Resolver(() => Task)
@AuthorizedGql(...EXECUTION_ROLES)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Mutation(() => [Task])
  @Roles(...PLANNING_WRITE_ROLES)
  async createTasksFromSeason(
    @Args("input") input: CreateTasksFromSeasonInput,
    @CurrentUser() user: User,
  ) {
    return this.taskService.createTasksFromSeason(
      input.seasonId,
      user.companyId!,
    );
  }

  @Mutation(() => Task)
  @Roles(...PLANNING_WRITE_ROLES)
  async assignTask(
    @Args("taskId") taskId: string,
    @Args("assigneeId") assigneeId: string,
    @CurrentUser() user: User,
  ) {
    return this.taskService.assignTask(
      taskId,
      assigneeId,
      user,
      user.companyId!,
    );
  }

  @Mutation(() => Task)
  async startTask(@Args("taskId") taskId: string, @CurrentUser() user: User) {
    return this.taskService.startTask(taskId, user, user.companyId!);
  }

  @Mutation(() => Task)
  async completeTask(
    @Args("taskId") taskId: string,
    @Args({
      name: "actuals",
      type: () => [TaskResourceActualInput],
      nullable: true,
    })
    actuals: TaskResourceActualInput[],
    @CurrentUser() user: User,
  ) {
    return this.taskService.completeTask(
      taskId,
      actuals,
      user,
      user.companyId!,
    );
  }

  @Mutation(() => Task)
  async cancelTask(
    @Args("taskId") taskId: string,
    @Args("reason") reason: string,
    @CurrentUser() user: User,
  ) {
    return this.taskService.cancelTask(taskId, reason, user, user.companyId!);
  }
}
