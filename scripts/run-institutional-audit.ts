import { runReplayTest } from '../apps/web/core/governance/InstitutionalReplay.test.ts';

async function main() {
    try {
        const success = await runReplayTest();
        if (success) {
            console.log('Institutional Audit: ALL TESTS PASSED (10/10)');
            process.exit(0);
        } else {
            console.error('Institutional Audit: TESTS FAILED');
            process.exit(1);
        }
    } catch (err) {
        console.error('Audit Error:', err);
        process.exit(1);
    }
}

main();
