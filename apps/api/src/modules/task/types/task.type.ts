import { ObjectType, Field, registerEnumType } from "@nestjs/graphql";
import { TaskStatus } from "@prisma/client";
import { TaskResourceActual } from "./task-resource.type";

registerEnumType(TaskStatus, { name: "TaskStatus" });

@ObjectType()
export class Task {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => TaskStatus)
  status: TaskStatus;

  @Field(() => String)
  seasonId: string;

  @Field(() => String, { nullable: true })
  operationId?: string;

  @Field(() => String)
  fieldId: string;

  @Field(() => String, { nullable: true })
  assigneeId?: string;

  @Field(() => Date, { nullable: true })
  plannedDate?: Date;

  @Field(() => Date, { nullable: true })
  completedAt?: Date;

  @Field(() => String)
  companyId: string;

  @Field(() => [TaskResourceActual], { nullable: true })
  actualResources?: TaskResourceActual[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
