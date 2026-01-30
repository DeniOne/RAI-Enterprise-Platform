"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foundation_controller_1 = require("../controllers/foundation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Foundation is a system gate, requires basic authentication
router.use(auth_middleware_1.authenticate);
router.get('/status', (req, res) => foundation_controller_1.foundationController.getStatus(req, res));
router.post('/block-viewed', (req, res) => foundation_controller_1.foundationController.markBlockViewed(req, res));
router.post('/decision', (req, res) => foundation_controller_1.foundationController.submitDecision(req, res));
exports.default = router;
