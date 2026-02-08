import { Module } from "@nestjs/common";
import { ConsultingService } from "./consulting.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    providers: [ConsultingService],
    exports: [ConsultingService],
})
export class ConsultingModule { }
