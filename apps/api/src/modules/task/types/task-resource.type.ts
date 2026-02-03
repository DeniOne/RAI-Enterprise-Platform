import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class TaskResourceActual {
    @Field(() => String)
    id: string;

    @Field(() => String)
    taskId: string;

    @Field(() => String)
    type: string;

    @Field(() => String)
    name: string;

    @Field(() => Float)
    amount: number;

    @Field(() => String)
    unit: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
