/**
 * Services Barrel Export
 * Module 08 — BusinessCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Только интерфейсы, реализации нет
 */

export * from './bc.service.interface';
export * from './gbc.service.interface';
export * from './store.service.interface';
export * from './auction.service.interface';
export * from './ai-adapter.interface';

// Implementations (STEP 2.4)
export * from './bc.service';
export * from './gbc.service';

// Implementations (STEP 3.1 / PHASE 0)
export * from './store-eligibility.service';

// Implementations (PHASE 1)
export * from './store-purchase.service';

// Implementations (STEP 3.2)
export * from './auction.service';

// Implementations (STEP 3.3)
export * from './gbc-recognition.service';

// Implementations (STEP 4)
export * from './governance.service';

export * from './store-eligibility.adapter';
export * from './audit-event.repository';


