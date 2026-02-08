import { RiskFsm, RiskFsmState } from './packages/risk-engine/src/core/RiskFsm';
import { VerdictRules } from './packages/risk-engine/src/core/VerdictRules';
import { RiskSeverity, RiskSource } from '@rai/prisma-client';

async function verify() {
    console.log('🛡️ Verifying Risk Engine Core Logic...');

    // 1. Verify FSM Transitions (Escalation)
    console.log('\nTesting FSM Escalation:');
    let state = RiskFsmState.CLEAR;
    const path = [state];

    // Simulate Escalation: CLEAR -> CRITICAL (Should be clamped?) 
    // Canon: "Перепрыгивать состояния нельзя"
    // My implementation: Force stepwise?
    // Let's test transition(CLEAR, CRITICAL)
    const next = RiskFsm.transition(state, RiskFsmState.CRITICAL);
    console.log(`Transition CLEAR -> CRITICAL => ${next} (Expected: OBSERVED or ELEVATED depending on strictness)`);
    // NOTE: In my implementation I wrote: if rank > current + 1 -> return current + 1.
    // CLEAR(0) -> CRITICAL(3). 3 > 1. Return 1 (OBSERVED).

    if (next === RiskFsmState.OBSERVED) console.log('✅ Correctly Clamped to OBSERVED');
    else console.error('❌ Failed jumping check');

    // 2. Verify Verdict Rules
    console.log('\nTesting Verdict Rules:');
    const signals = [
        { severity: RiskSeverity.HIGH, source: RiskSource.LEGAL } as any
    ];
    const verdictState = VerdictRules.evaluate(signals);
    console.log(`Signals: [HIGH + LEGAL] => State: ${verdictState} (Expected: BLOCKED)`);

    if (verdictState === RiskFsmState.BLOCKED) console.log('✅ Legal High -> BLOCKED Rule Verification Passed');
    else console.error('❌ Verdict Rule Failed');

    // 3. Verify De-escalation
    console.log('\nTesting FSM De-escalation:');
    const deesc = RiskFsm.transition(RiskFsmState.BLOCKED, RiskFsmState.CLEAR);
    console.log(`Transition BLOCKED -> CLEAR => ${deesc} (Expected: CRITICAL)`);

    if (deesc === RiskFsmState.CRITICAL) console.log('✅ Correctly Clamped to CRITICAL');
    else console.error('❌ De-escalation Jump Check Failed');

    console.log('\nVerification Complete.');
}

// Mocking enum if ts-node fails to resolve path mappings without tsconfig-paths
// But let's try running with ts-node/register if needed.
verify();
