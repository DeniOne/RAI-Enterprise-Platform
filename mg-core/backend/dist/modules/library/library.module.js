"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
const document_service_1 = require("./services/document.service");
const version_service_1 = require("./services/version.service");
const link_service_1 = require("./services/link.service");
const storage_service_1 = require("./services/storage.service");
const library_controller_1 = require("./controllers/library.controller");
const personnel_archiving_listener_1 = require("./listeners/personnel-archiving.listener");
let LibraryModule = class LibraryModule {
};
exports.LibraryModule = LibraryModule;
exports.LibraryModule = LibraryModule = __decorate([
    (0, common_1.Module)({
        imports: [event_emitter_1.EventEmitterModule.forRoot()],
        controllers: [library_controller_1.LibraryController],
        providers: [
            prisma_service_1.PrismaService,
            document_service_1.DocumentService,
            version_service_1.VersionService,
            link_service_1.LinkService,
            storage_service_1.StorageService,
            personnel_archiving_listener_1.PersonnelArchivingListener,
        ],
        exports: [
            document_service_1.DocumentService,
            version_service_1.VersionService,
            link_service_1.LinkService,
            storage_service_1.StorageService,
        ],
    })
], LibraryModule);
