import { Currency, TransactionType, AuctionStatus } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';
export declare class WalletResponseDto {
    userId: UUID;
    mcBalance: number;
    gmcBalance: number;
    mcFrozen?: number;
    safeActivatedAt?: ISODateTime;
    safeExpiresAt?: ISODateTime;
    updatedAt: ISODateTime;
}
export declare class CreateTransactionRequestDto {
    type: TransactionType;
    currency: Currency;
    amount: number;
    recipientId?: UUID;
    description?: string;
}
export declare class TransactionResponseDto {
    id: UUID;
    type: TransactionType;
    currency: Currency;
    amount: number;
    senderId?: UUID;
    recipientId?: UUID;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: ISODateTime;
}
export declare class ActivateSafeRequestDto {
    amount: number;
}
export declare class AuctionResponseDto {
    id: UUID;
    title: string;
    description?: string;
    startingBid: number;
    currentBid: number;
    currentBidderId?: UUID;
    gmcAmount: number;
    status: AuctionStatus;
    startsAt: ISODateTime;
    endsAt: ISODateTime;
    createdAt: ISODateTime;
}
export declare class PlaceBidRequestDto {
    amount: number;
}
export declare class RankDiscountDto {
    'Инвестор'?: number;
    'Магнат'?: number;
}
export declare class StoreItemResponseDto {
    id: UUID;
    name: string;
    description?: string;
    price: number;
    currency: Currency;
    image?: string;
    available: boolean;
    stock?: number;
    rankDiscount?: RankDiscountDto;
}
export declare class PurchaseItemRequestDto {
    itemId: UUID;
    quantity: number;
}
//# sourceMappingURL=economy.dto.d.ts.map