import { ObjectType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import { SeasonStatus } from '@prisma/client';

registerEnumType(SeasonStatus, { name: 'SeasonStatus' });

@ObjectType()
export class Season {
    @Field(() => String)
    id: string;

    @Field(() => Int)
    year: number;

    @Field(() => SeasonStatus)
    status: SeasonStatus;

    @Field(() => String)
    fieldId: string;

    @Field(() => String)
    rapeseedId: string;

    @Field(() => String, { nullable: true })
    technologyCardId?: string;

    @Field(() => Float, { nullable: true })
    expectedYield?: number;

    @Field(() => Float, { nullable: true })
    actualYield?: number;

    @Field(() => Boolean)
    isLocked: boolean;

    @Field(() => Date, { nullable: true })
    lockedAt?: Date;

    @Field(() => String, { nullable: true })
    lockedBy?: string;

    @Field(() => Date, { nullable: true })
    startDate?: Date;

    @Field(() => Date, { nullable: true })
    endDate?: Date;

    @Field(() => String)
    companyId: string;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
