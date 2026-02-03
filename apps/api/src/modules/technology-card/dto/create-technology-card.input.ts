import { InputType, Field, Int, Float } from '@nestjs/graphql';

@InputType()
export class CreateResourceInput {
    @Field(() => String)
    type: string;

    @Field(() => String)
    name: string;

    @Field(() => Float)
    dosage: number;

    @Field(() => String)
    unit: string;
}

@InputType()
export class CreateOperationInput {
    @Field(() => String)
    name: string;

    @Field(() => Int)
    sequence: number;

    @Field(() => String, { nullable: true })
    stageId?: string;

    @Field(() => String, { nullable: true })
    description?: string;

    @Field(() => [CreateResourceInput], { nullable: true })
    resources?: CreateResourceInput[];
}

@InputType()
export class CreateTechnologyCardInput {
    @Field(() => String)
    name: string;

    @Field(() => String, { nullable: true })
    description?: string;

    @Field(() => [CreateOperationInput], { nullable: true })
    operations?: CreateOperationInput[];
}
