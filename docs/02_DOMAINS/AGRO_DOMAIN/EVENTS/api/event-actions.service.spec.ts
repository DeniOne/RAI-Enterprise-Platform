import { EventActionsService } from './event-actions.service';
import { EventDraftRepository } from '../storage/event-draft.repository';
import { DraftLinkerService } from '../linking/draft-linker.service';
import { MustValidator } from '../validation/must-validator';

describe('EventActionsService', () => {
    let service: EventActionsService;
    let repository: jest.Mocked<EventDraftRepository>;
    let linker: jest.Mocked<DraftLinkerService>;
    let validator: jest.Mocked<MustValidator>;
    let committer: jest.Mocked<any>;

    beforeEach(() => {
        repository = {
            getDraft: jest.fn(),
            updateDraft: jest.fn(),
            markCommitted: jest.fn(),
        } as any;
        linker = {
            linkDraft: jest.fn(),
        } as any;
        validator = {
            validateMust: jest.fn(),
        } as any;
        committer = {
            commit: jest.fn(),
        } as any;

        service = new EventActionsService(repository, linker, validator, committer);
    });

    const tenantId = 't1';
    const userId = 'u1';
    const draftId = 'd1';

    it('fix() applies patch, runs linker and re-validates MUST', async () => {
        const mockDraft = {
            id: draftId,
            status: 'DRAFT',
            payload: { description: 'old' },
            missingMust: ['fieldRef'],
        };
        repository.getDraft.mockResolvedValue(mockDraft as any);
        linker.linkDraft.mockImplementation(async (d) => d);
        validator.validateMust.mockReturnValue([]);
        repository.updateDraft.mockImplementation(async (t, u, id, d) => ({ ...mockDraft, ...d } as any));

        const result = await service.fix(tenantId, userId, draftId, { description: 'new' });

        expect(result.draft.status).toBe('READY_FOR_CONFIRM');
        expect((result.draft.payload as any).description).toBe('new');
        expect(repository.updateDraft).toHaveBeenCalled();
    });

    it('link() updates refs and checks MUST', async () => {
        const mockDraft = {
            id: draftId,
            status: 'DRAFT',
            missingMust: ['fieldRef'],
        };
        repository.getDraft.mockResolvedValue(mockDraft as any);
        validator.validateMust.mockReturnValue([]); // fieldRef added
        repository.updateDraft.mockImplementation(async (t, u, id, d) => ({ ...mockDraft, ...d } as any));

        const result = await service.link(tenantId, userId, draftId, { fieldRef: 'f1' });

        expect(result.draft.status).toBe('READY_FOR_CONFIRM');
        expect(result.draft.fieldRef).toBe('f1');
    });

    it('confirm() fails if MUST fields are missing', async () => {
        const mockDraft = {
            id: draftId,
            status: 'DRAFT',
            missingMust: [],
        };
        repository.getDraft.mockResolvedValue(mockDraft as any);
        validator.validateMust.mockReturnValue(['fieldRef']); // Still missing fieldRef
        repository.updateDraft.mockResolvedValue({} as any);

        const result = await service.confirm(tenantId, userId, draftId);

        expect(result.draft.status).toBe('DRAFT');
        expect(result.ui.mustQuestions).toContain('Пожалуйста, укажи fieldRef');
    });

    it('confirm() commits if MUST fields are satisfied', async () => {
        const mockDraft = {
            id: draftId,
            status: 'READY_FOR_CONFIRM',
            missingMust: [],
            payload: {},
            evidence: [],
            timestamp: new Date().toISOString(),
        };
        repository.getDraft.mockResolvedValue(mockDraft as any);
        validator.validateMust.mockReturnValue([]);
        repository.markCommitted.mockResolvedValue();

        const result = await service.confirm(tenantId, userId, draftId);

        expect(repository.markCommitted).toHaveBeenCalledWith(tenantId, userId, draftId);
        expect(result.ui.message).toContain('successfully');
    });
});
