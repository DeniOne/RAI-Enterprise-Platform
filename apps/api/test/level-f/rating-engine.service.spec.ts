import { Test, TestingModule } from '@nestjs/testing';
import { RatingEngineService, CertificationGrade } from '../../src/level-f/certification/rating-engine.service';
import { AssertionFencesService } from '../../src/level-f/certification/assertion-fences.service';
import { SnapshotPayload } from '../../src/level-f/snapshot/snapshot.service';

describe('Certification Engine (Phase 4)', () => {
    let ratingEngine: RatingEngineService;
    let fences: AssertionFencesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RatingEngineService, AssertionFencesService],
        }).compile();

        ratingEngine = module.get<RatingEngineService>(RatingEngineService);
        fences = module.get<AssertionFencesService>(AssertionFencesService);
    });

    const mockPayload: SnapshotPayload = {
        companyId: 'comp_1',
        nonce: Date.now(),
        schemaVersion: 'schema_v1',
        temporalBounds: { startDate: '2026', endDate: '2026' },
        lineageHash: 'hash',
        previousHash: 'prev',
        rawSource: [{ fakeData: 1 }],
    };

    it('should be defined', () => {
        expect(ratingEngine).toBeDefined();
        expect(fences).toBeDefined();
    });

    it('[AssertionFences] evaluates valid fences and passes', () => {
        const result = fences.evaluateFences(mockPayload);
        expect(result.passed).toBe(true);
        expect(result.violations.length).toBe(0);
    });

    it('[AssertionFences] fails if rawSource is empty (I40 Violation)', () => {
        const emptyPayload = { ...mockPayload, rawSource: [] };
        const result = fences.evaluateFences(emptyPayload);
        expect(result.passed).toBe(false);
        expect(result.violations[0]).toContain('I40');
    });

    it('[RatingEngine] assigns a grade based on fenced snapshot', () => {
        const rating = ratingEngine.evaluateSnapshot(mockPayload);
        expect(rating.fenceStatus.passed).toBe(true);
        expect(rating.grade).toBeDefined();
        expect(rating.grade).not.toEqual(CertificationGrade.D); // Default mock scores to 85 -> 'A'
    });

    it('[RatingEngine] immediately assigns Grade D if fences fail', () => {
        const emptyPayload = { ...mockPayload, rawSource: [] };
        const rating = ratingEngine.evaluateSnapshot(emptyPayload);
        expect(rating.fenceStatus.passed).toBe(false);
        expect(rating.grade).toEqual(CertificationGrade.D);
        expect(rating.score).toBe(0);
    });
});
