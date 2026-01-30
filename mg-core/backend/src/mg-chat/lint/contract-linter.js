/**
 * MG Chat Contract Linter
 * 
 * Validates MG Chat contracts for v2 compliance.
 */

const fs = require('fs');
const path = require('path');

// From backend/src/mg-chat/lint → go up 4 levels to project root
const CONTRACTS_DIR = path.join(__dirname, '..', '..', '..', '..', 'documentation', 'ai', 'mg-chat');

console.log('🔍 MG Chat Contract Linter v2\n');

let errors = 0;
let warnings = 0;

// Load intent map
const intentMapPath = path.join(CONTRACTS_DIR, 'mg_intent_map.json');
console.log(`📄 Checking: ${intentMapPath}`);

if (!fs.existsSync(intentMapPath)) {
    console.error('❌ Intent map not found');
    process.exit(1);
}

const intentMap = JSON.parse(fs.readFileSync(intentMapPath, 'utf-8'));

// Check version
if (intentMap.version !== '2.0.0') {
    console.error(`❌ Version mismatch: expected 2.0.0, got ${intentMap.version}`);
    errors++;
}

// Check intents
if (!intentMap.intents || !Array.isArray(intentMap.intents)) {
    console.error('❌ Missing or invalid intents array');
    errors++;
    process.exit(1);
}

console.log(`\n📊 Found ${intentMap.intents.length} intents\n`);

// Validate each intent
const namespaces = { employee: 0, manager: 0, exec: 0 };
const allIntentIds = new Set();
const allActionIds = new Set();

intentMap.intents.forEach((intent, index) => {
    const prefix = `Intent #${index + 1} (${intent.id || 'UNNAMED'})`;

    // Required fields
    if (!intent.id) {
        console.error(`❌ ${prefix}: Missing 'id'`);
        errors++;
        return;
    }

    allIntentIds.add(intent.id);

    // Namespace validation
    const [namespace, action] = intent.id.split('.');
    if (!namespace || !action) {
        console.error(`❌ ${prefix}: Invalid namespace format (expected: namespace.action)`);
        errors++;
    } else if (!['employee', 'manager', 'exec'].includes(namespace)) {
        console.error(`❌ ${prefix}: Invalid namespace '${namespace}' (expected: employee, manager, exec)`);
        errors++;
    } else {
        namespaces[namespace]++;
    }

    // Required v2 fields
    if (!intent.contour) {
        console.error(`❌ ${prefix}: Missing 'contour'`);
        errors++;
    }

    if (!intent.scope) {
        console.error(`❌ ${prefix}: Missing 'scope'`);
        errors++;
    }

    if (!intent.examples || !Array.isArray(intent.examples) || intent.examples.length === 0) {
        console.error(`❌ ${prefix}: Missing or empty 'examples'`);
        errors++;
    }

    if (!intent.response) {
        console.error(`❌ ${prefix}: Missing 'response'`);
        errors++;
    } else {
        if (!intent.response.text) {
            console.error(`❌ ${prefix}: Missing 'response.text'`);
            errors++;
        }

        if (intent.response.actions) {
            intent.response.actions.forEach(actionId => {
                allActionIds.add(actionId);
            });
        }
    }

    // Optional warnings
    if (!intent.entry_points || intent.entry_points.length === 0) {
        console.warn(`⚠️  ${prefix}: Missing 'entry_points'`);
        warnings++;
    }

    if (intent.confidence_threshold === undefined) {
        console.warn(`⚠️  ${prefix}: Missing 'confidence_threshold'`);
        warnings++;
    }
});

// Cross-reference validation
console.log('\n🔗 Checking cross-references...\n');

allActionIds.forEach(actionId => {
    if (!allIntentIds.has(actionId)) {
        console.error(`❌ Action '${actionId}' references non-existent intent`);
        errors++;
    }
});

// Summary
console.log('\n📊 Summary:\n');
console.log(`  Employee intents: ${namespaces.employee}`);
console.log(`  Manager intents: ${namespaces.manager}`);
console.log(`  Executive intents: ${namespaces.exec}`);
console.log(`  Total: ${intentMap.intents.length}`);

console.log(`\n  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
    console.log('\n❌ Linting FAILED\n');
    process.exit(1);
} else if (warnings > 0) {
    console.log('\n⚠️  Linting PASSED with warnings\n');
    process.exit(0);
} else {
    console.log('\n✅ Linting PASSED\n');
    process.exit(0);
}
