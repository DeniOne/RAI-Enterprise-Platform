import { IsNotEmpty, IsString, Matches } from "class-validator";

export class BankLookupRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9}$/, { message: "БИК должен содержать 9 цифр" })
  bic!: string;
}
