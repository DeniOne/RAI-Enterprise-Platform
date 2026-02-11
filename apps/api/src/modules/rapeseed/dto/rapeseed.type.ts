import {
  ObjectType,
  Field,
  Int,
  Float,
  registerEnumType,
} from "@nestjs/graphql";
import { RapeseedType } from "@rai/prisma-client";

registerEnumType(RapeseedType, { name: "RapeseedType" });

@ObjectType()
export class Rapeseed {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  variety?: string;

  @Field(() => String, { nullable: true })
  reproduction?: string;

  @Field(() => RapeseedType)
  type: RapeseedType;

  @Field(() => Float, { nullable: true })
  oilContent?: number;

  @Field(() => Float, { nullable: true })
  erucicAcid?: number;

  @Field(() => Float, { nullable: true })
  glucosinolates?: number;

  @Field(() => Int)
  vegetationPeriod: number;

  @Field(() => Float, { nullable: true })
  sowingNormMin?: number;

  @Field(() => Float, { nullable: true })
  sowingNormMax?: number;

  @Field(() => Float, { nullable: true })
  sowingDepthMin?: number;

  @Field(() => Float, { nullable: true })
  sowingDepthMax?: number;

  @Field(() => Int)
  version: number;

  @Field(() => Boolean)
  isLatest: boolean;

  @Field(() => String, { nullable: true })
  companyId?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
