import { Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { UserRole, UserAccessLevel } from "@rai/prisma-client";
// Removed: InjectBot, Telegraf - bot is now a separate microservice
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { resolveTelegramTunnel } from "./telegram-tunnel.resolver";

export interface TelegramLoginSession {
  sessionId: string;
  telegramId: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  expiresAt: string;
}

interface TelegramWebAppIdentity {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

@Injectable()
export class TelegramAuthService {
  private readonly SESSION_TTL = 300; // 5 minutes

  constructor(
    private redis: RedisService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async initiateLogin(
    telegramId: string,
    companyId?: string,
  ): Promise<{ sessionId: string }> {
    console.log(
      `[TelegramAuthService] Initiating login for telegramId: "${telegramId}" (type: ${typeof telegramId})`,
    );

    // Check if user exists
    let user = await this.prisma.user.findFirst({
      where: {
        telegramId: telegramId.trim(),
        ...(companyId ? { companyId } : {}),
      },
    });

    // Auto-onboarding for Super Admin (Owner)
    if (!user && telegramId.trim() === "441610858") {
      console.log(
        `[TelegramAuthService] Super Admin onboarding triggered for TG ID: ${telegramId}`,
      );

      // Ensure root company exists
      let rootCompany = await this.prisma.company.findFirst();
      if (!rootCompany) {
        rootCompany = await this.prisma.company.create({
          data: {
            name: "RAI Enterprise (Root)",
          },
        });
        console.log(
          `[TelegramAuthService] Created Root Company: ${rootCompany.id}`,
        );
      }

      // Create Super Admin user
      user = await this.prisma.user.create({
        data: {
          telegramId: telegramId.trim(),
          email: "owner@rai.local",
          role: "ADMIN",
          accessLevel: "ACTIVE",
          emailVerified: true,
          company: { connect: { id: rootCompany.id } },
        },
      });
      console.log(`[TelegramAuthService] Created Super Admin User: ${user.id}`);
    }

    if (!user) {
      console.log(
        `[TelegramAuthService] User with telegramId "${telegramId}" not found in database`,
      );
      throw new Error("User not found");
    }

    console.log(
      `[TelegramAuthService] User found: ${user.email} (ID: ${user.id})`,
    );

    const sessionId = randomUUID();
    const session: TelegramLoginSession = {
      sessionId,
      telegramId,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000).toISOString(),
    };

    await this.redis.set(
      `telegram-login:${sessionId}`,
      JSON.stringify(session),
      this.SESSION_TTL,
    );

    // Notify bot microservice to send Telegram push notification
    try {
      await fetch(
        `${process.env.BOT_URL || "http://localhost:4002"}/internal/notify-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
          },
          body: JSON.stringify({
            telegramId,
            sessionId,
          }),
        },
      );
    } catch (error) {
      console.error("Failed to notify bot microservice:", error);
      // Don't throw - session is created, notification is best-effort
    }

    return { sessionId };
  }

  async confirmLogin(sessionId: string): Promise<{ accessToken: string }> {
    const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
    if (!sessionData) {
      throw new Error("Session not found or expired");
    }

    const session: TelegramLoginSession = JSON.parse(sessionData);

    // If already approved, just return the token
    if (session.status === "approved") {
      return this.generateTokenForTelegramUser(session.telegramId);
    }

    if (session.status !== "pending") {
      throw new Error(`Session already processed (status: ${session.status})`);
    }

    // Update session status to approved
    session.status = "approved";
    await this.redis.set(
      `telegram-login:${sessionId}`,
      JSON.stringify(session),
      60, // Keep for 1 minute for polling to pick up
    );

    return this.generateTokenForTelegramUser(session.telegramId);
  }

  private async generateTokenForTelegramUser(
    telegramId: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { telegramId: telegramId.trim() },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return { accessToken: this.generateTokenForUser(user) };
  }

  private generateTokenForUser(user: {
    id: string;
    email: string;
    companyId: string;
    role: UserRole | string;
    accountId?: string | null;
  }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      accountId: user.accountId ?? null,
    };

    return this.jwtService.sign(payload);
  }

  private verifyTelegramWebAppInitData(
    initData: string,
  ): TelegramWebAppIdentity {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) {
      throw new Error("Telegram WebApp hash is missing");
    }

    const dataCheckEntries: string[] = [];
    for (const [key, value] of params.entries()) {
      if (key === "hash") {
        continue;
      }
      dataCheckEntries.push(`${key}=${value}`);
    }
    dataCheckEntries.sort();
    const dataCheckString = dataCheckEntries.join("\n");

    const botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    const calculated = Buffer.from(calculatedHash, "hex");
    const provided = Buffer.from(hash, "hex");
    if (
      calculated.length !== provided.length ||
      !timingSafeEqual(calculated, provided)
    ) {
      throw new Error("Telegram WebApp initData signature is invalid");
    }

    const userJson = params.get("user");
    if (!userJson) {
      throw new Error("Telegram WebApp user is missing");
    }

    let userPayload: {
      id?: number | string;
      first_name?: string;
      last_name?: string;
      username?: string;
    } | null = null;
    try {
      userPayload = JSON.parse(userJson);
    } catch {
      throw new Error("Telegram WebApp user payload is invalid");
    }

    if (!userPayload?.id) {
      throw new Error("Telegram WebApp user id is missing");
    }

    return {
      telegramId: String(userPayload.id),
      firstName: userPayload.first_name?.trim() || undefined,
      lastName: userPayload.last_name?.trim() || undefined,
      username: userPayload.username?.trim() || undefined,
    };
  }

  async denyLogin(sessionId: string): Promise<void> {
    const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
    if (!sessionData) {
      throw new Error("Session not found or expired");
    }

    const session: TelegramLoginSession = JSON.parse(sessionData);
    session.status = "denied";

    await this.redis.set(
      `telegram-login:${sessionId}`,
      JSON.stringify(session),
      60, // Keep for 1 minute for polling to pick up
    );
  }

  async checkLoginStatus(sessionId: string): Promise<TelegramLoginSession> {
    const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
    if (!sessionData) {
      throw new Error("Session not found or expired");
    }

    return JSON.parse(sessionData);
  }

  async getUserByTelegramId(telegramId: string, companyId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        telegramId: telegramId.trim(),
        ...(companyId ? { companyId } : {}),
      },
      include: {
        account: true,
        employeeProfile: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      telegramTunnel: resolveTelegramTunnel(user),
    };
  }

  async loginViaTelegramWebApp(initData: string) {
    const telegramIdentity = this.verifyTelegramWebAppInitData(initData);
    const user = await this.prisma.user.findFirst({
      where: { telegramId: telegramIdentity.telegramId },
      include: {
        company: true,
        account: true,
        employeeProfile: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const telegramDisplayName =
      [telegramIdentity.firstName, telegramIdentity.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      telegramIdentity.username ||
      undefined;

    const fallbackName = user.email.split("@")[0];
    const shouldRefreshName =
      Boolean(telegramDisplayName) &&
      (!user.name?.trim() || user.name.trim() === fallbackName);

    const effectiveName =
      shouldRefreshName && telegramDisplayName
        ? telegramDisplayName
        : user.name;

    if (shouldRefreshName && telegramDisplayName) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { name: telegramDisplayName },
      });
    }

    return {
      accessToken: this.generateTokenForUser(user),
      user: {
        id: user.id,
        email: user.email,
        name: effectiveName ?? fallbackName,
        role: user.role,
        companyId: user.companyId,
        accountId: user.accountId ?? null,
        employeeProfile: user.employeeProfile ?? null,
        telegramTunnel: resolveTelegramTunnel(user),
      },
    };
  }

  async upsertUserFromTelegram(data: {
    telegramId: string;
    email: string;
    role: string;
    accessLevel: string;
    companyId: string;
  }) {
    return this.prisma.user.upsert({
      where: { telegramId: data.telegramId },
      update: {
        accessLevel: data.accessLevel as UserAccessLevel,
        company: { connect: { id: data.companyId } },
      },
      create: {
        telegramId: data.telegramId,
        email: data.email,
        role: data.role as UserRole,
        accessLevel: data.accessLevel as UserAccessLevel,
        // companyId: data.companyId, // Redundant with connect for standard CreateInput
        company: { connect: { id: data.companyId } },
        emailVerified: true,
      },
    });
  }

  async getFirstCompany() {
    return this.prisma.company.findFirst();
  }

  async getActiveUsers(companyId?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        accessLevel: "ACTIVE",
        telegramId: { not: null },
      },
      select: {
        telegramId: true,
        email: true,
      },
    });
  }
}
