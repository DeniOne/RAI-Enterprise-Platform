"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_registration_controller_1 = __importDefault(require("../controllers/employee-registration.controller"));
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// All routes require authentication
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// Admin/HR only - send registration invitation
router.post('/invite', authenticate, (req, res) => employee_registration_controller_1.default.inviteEmployee(req, res));
// Admin/HR only - get all registration requests
router.get('/requests', authenticate, (req, res) => employee_registration_controller_1.default.getRegistrationRequests(req, res));
// Admin/HR only - get single registration request
router.get('/requests/:id', authenticate, (req, res) => employee_registration_controller_1.default.getRegistrationRequest(req, res));
// Admin/HR only - approve registration
router.post('/requests/:id/approve', authenticate, (req, res) => employee_registration_controller_1.default.approveRegistration(req, res));
// Admin/HR only - reject registration
router.post('/requests/:id/reject', authenticate, (req, res) => employee_registration_controller_1.default.rejectRegistration(req, res));
// Admin/HR only - get registration statistics
router.get('/stats', authenticate, (req, res) => employee_registration_controller_1.default.getRegistrationStats(req, res));
exports.default = router;
