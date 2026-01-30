import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentService } from './services/document.service';
import { VersionService } from './services/version.service';
import { LinkService } from './services/link.service';
import { StorageService } from './services/storage.service';
import { LibraryController } from './controllers/library.controller';
import { PersonnelArchivingListener } from './listeners/personnel-archiving.listener';

@Module({
    imports: [EventEmitterModule.forRoot()],
    controllers: [LibraryController],
    providers: [
        PrismaService,
        DocumentService,
        VersionService,
        LinkService,
        StorageService,
        PersonnelArchivingListener,
    ],
    exports: [
        DocumentService,
        VersionService,
        LinkService,
        StorageService,
    ],
})
export class LibraryModule { }
