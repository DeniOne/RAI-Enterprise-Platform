/**
 * Services Barrel Export
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Только интерфейсы, реализации нет
 */

export * from './mc.service.interface';
export * from './gmc.service.interface';
export * from './store.service.interface';
export * from './auction.service.interface';
export * from './ai-adapter.interface';

// Implementations (STEP 2.4)
export * from './mc.service';
export * from './gmc.service';

// Implementations (STEP 3.1 / PHASE 0)
export * from './store-eligibility.service';

// Implementations (PHASE 1)
export * from './store-purchase.service';

// Implementations (STEP 3.2)
export * from './auction.service';

// Implementations (STEP 3.3)
export * from './gmc-recognition.service';

// Implementations (STEP 4)
export * from './governance.service';

export * from './store-eligibility.adapter';
export * from './audit-event.repository';
