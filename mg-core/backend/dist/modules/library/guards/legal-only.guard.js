"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalOnlyGuard = void 0;
const common_1 = require("@nestjs/common");
let LegalOnlyGuard = class LegalOnlyGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        // CRITICAL: Only LEGAL_COUNSEL can destroy documents
        const legalRoles = ['LEGAL_COUNSEL', 'LEGAL_MANAGER'];
        if (!legalRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('Only Legal personnel can destroy documents');
        }
        return true;
    }
};
exports.LegalOnlyGuard = LegalOnlyGuard;
exports.LegalOnlyGuard = LegalOnlyGuard = __decorate([
    (0, common_1.Injectable)()
], LegalOnlyGuard);
