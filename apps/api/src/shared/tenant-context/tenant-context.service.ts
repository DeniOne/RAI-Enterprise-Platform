import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { TenantScope } from "./tenant-scope";

export interface TenantStore {
  scope: TenantScope;
}

@Injectable()
export class TenantContextService {
  private static readonly storage = new AsyncLocalStorage<TenantStore>();

  run(store: TenantStore, callback: () => void | Promise<void>) {
    return TenantContextService.storage.run(store, callback);
  }

  getStore(): TenantScope | undefined {
    return TenantContextService.storage.getStore()?.scope;
  }

  getCompanyId(): string | undefined {
    return this.getStore()?.companyId;
  }

  isSystemOperation(): boolean {
    return !!this.getStore()?.isSystem;
  }
}
