"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechMapValidator = void 0;
const common_1 = require("@nestjs/common");
let TechMapValidator = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TechMapValidator = _classThis = class {
        constructor(unitService) {
            this.unitService = unitService;
        }
        /**
         * Validates a TechMap for activation capability.
         * Enforces Phase 2 Rules: Strict Types, Norms, Units.
         */
        validateForActivation(techMap) {
            const errors = [];
            if (!techMap.stages || techMap.stages.length === 0) {
                errors.push('TechMap must have at least one stage');
            }
            techMap.stages.forEach(stage => {
                stage.operations.forEach(op => {
                    // Strict Norm validation
                    if (!op.resources || op.resources.length === 0) {
                        // Warnings allowed? Phase 2 docs say "100% budget from norms".
                        // If an operation has NO resources, it generates NO budget. This might be valid (e.g. "Inspection").
                        // But if it implies cost (e.g. Fuel), it MUST be detailed. 
                        // specific logic for machinery type check could be added here.
                    }
                    op.resources.forEach(res => {
                        this.validateResource(res, op.name, errors);
                    });
                });
            });
            if (errors.length > 0) {
                throw new common_1.BadRequestException(`TechMap Activation Failed:\n${errors.join('\n')}`);
            }
        }
        validateResource(res, opName, errors) {
            // 1. Amount must be positive
            if (typeof res.amount !== 'number' || res.amount <= 0) {
                errors.push(`Operation '${opName}': Resource '${res.name}' has invalid amount (${res.amount})`);
            }
            // 2. Unit must be canonicalizable
            try {
                this.unitService.normalize(res.amount, res.unit);
            }
            catch (e) {
                errors.push(`Operation '${opName}': Resource '${res.name}' has invalid unit '${res.unit}'. Error: ${e.message}`);
            }
            // 3. Cost check (Optional for map, but good for warnings)
            // Prices are fetched from Registry, but here we might check if 'costPerUnit' is cached/estimated?
            // Focusing on physical norms for Phase 2.1
        }
    };
    __setFunctionName(_classThis, "TechMapValidator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TechMapValidator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TechMapValidator = _classThis;
})();
exports.TechMapValidator = TechMapValidator;
