export class ConsultingOperationCompletedEvent {
    constructor(
        public readonly executionId: string,
        public readonly operationId: string,
        public readonly techMapId: string,
        public readonly stockTransactionIds: string[],
        public readonly companyId: string,
    ) { }
}
