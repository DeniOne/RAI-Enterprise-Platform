import { ObjectType, Field, Int, Float } from "@nestjs/graphql";

@ObjectType()
export class TechnologyCardResource {
  @Field(() => String)
  id: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  dosage: number;

  @Field(() => String)
  unit: string;
}

@ObjectType()
export class TechnologyCardOperation {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  sequence: number;

  @Field(() => String, { nullable: true })
  stageId?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => [TechnologyCardResource], { nullable: true })
  resources?: TechnologyCardResource[];
}

@ObjectType()
export class TechnologyCard {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  companyId: string;

  @Field(() => [TechnologyCardOperation], { nullable: true })
  operations?: TechnologyCardOperation[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
