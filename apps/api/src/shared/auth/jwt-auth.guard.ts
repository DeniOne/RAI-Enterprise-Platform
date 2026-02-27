import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DevModeService } from "./dev-mode.service";

/**
 * JwtAuthGuard — умный guard с переключателем dev/prod.
 *
 * AUTH_DISABLED=true  → bypass JWT, подставляет dev-пользователя в req.user
 * AUTH_DISABLED=false → стандартная JWT-проверка через Passport
 *
 * При деплое в prod: убери AUTH_DISABLED из .env (или = false).
 * Никакого другого кода менять не нужно.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    constructor(private readonly devModeService?: DevModeService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (this.devModeService?.isDevMode?.()) {
            // DEV MODE: пропускаем JWT, подставляем dev-пользователя
            const request = context.switchToHttp().getRequest();
            request.user = await this.devModeService.getDevUser();
            return true;
        }

        // PROD MODE: стандартная JWT проверка
        return super.canActivate(context) as Promise<boolean>;
    }
}
