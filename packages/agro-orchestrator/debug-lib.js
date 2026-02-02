const jsonLogic = require('json-logic-js');
console.log('Required:', jsonLogic);
console.log('Type:', typeof jsonLogic);
console.log('RulesLogic Type:', typeof jsonLogic.RulesLogic); // Check if types interfere (they shouldn't in JS)
console.log('Apply Function:', typeof jsonLogic.apply);
