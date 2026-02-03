import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { TaskService } from './task.service';
import { Task } from './types/task.type';
import { CreateTasksFromSeasonInput } from './dto/create-tasks.input';
import { TaskResourceActualInput } from './dto/task-resource.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../shared/auth/auth.guard';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { User } from '@prisma/client';

@Resolver(() => Task)
@UseGuards(GqlAuthGuard)
export class TaskResolver {
    constructor(private readonly taskService: TaskService) { }

    @Mutation(() => [Task])
    async createTasksFromSeason(
        @Args('input') input: CreateTasksFromSeasonInput,
        @CurrentUser() user: User,
    ) {
        return this.taskService.createTasksFromSeason(input.seasonId, user.companyId!);
    }

    @Mutation(() => Task)
    async assignTask(
        @Args('taskId') taskId: string,
        @Args('assigneeId') assigneeId: string,
        @CurrentUser() user: User,
    ) {
        return this.taskService.assignTask(taskId, assigneeId, user, user.companyId!);
    }

    @Mutation(() => Task)
    async startTask(
        @Args('taskId') taskId: string,
        @CurrentUser() user: User,
    ) {
        return this.taskService.startTask(taskId, user, user.companyId!);
    }

    @Mutation(() => Task)
    async completeTask(
        @Args('taskId') taskId: string,
        @Args({ name: 'actuals', type: () => [TaskResourceActualInput], nullable: true }) actuals: TaskResourceActualInput[],
        @CurrentUser() user: User,
    ) {
        return this.taskService.completeTask(taskId, actuals, user, user.companyId!);
    }

    @Mutation(() => Task)
    async cancelTask(
        @Args('taskId') taskId: string,
        @Args('reason') reason: string,
        @CurrentUser() user: User,
    ) {
        return this.taskService.cancelTask(taskId, reason, user, user.companyId!);
    }
}
