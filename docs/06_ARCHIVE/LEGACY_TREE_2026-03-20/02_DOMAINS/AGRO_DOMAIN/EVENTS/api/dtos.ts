export class ConfirmEventDto {
    draftId: string;
}

export class FixEventDto {
    draftId: string;
    patch: Record<string, any>;
}

export class LinkEventDto {
    draftId: string;
    farmRef?: string;
    fieldRef?: string;
    taskRef?: string;
}
