import { Module } from '@nestjs/common';
import { RaiChatController } from './rai-chat.controller';
import { AuthModule } from '../../shared/auth/auth.module';
import { TenantContextModule } from '../../shared/tenant-context/tenant-context.module';

@Module({
    imports: [AuthModule, TenantContextModule],
    controllers: [RaiChatController],
})
export class RaiChatModule { }
