import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { S3Service } from "./s3.service";
import { SecretsModule } from "../config/secrets.module";

@Global()
@Module({
  imports: [ConfigModule, SecretsModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
