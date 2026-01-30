import { Router } from 'express';
import employeeRegistrationController from '../controllers/employee-registration.controller';
import passport from 'passport';

const router = Router();

// All routes require authentication
const authenticate = passport.authenticate('jwt', { session: false });

// Admin/HR only - send registration invitation
router.post(
    '/invite',
    authenticate,
    (req, res) => employeeRegistrationController.inviteEmployee(req, res)
);

// Admin/HR only - get all registration requests
router.get(
    '/requests',
    authenticate,
    (req, res) => employeeRegistrationController.getRegistrationRequests(req, res)
);

// Admin/HR only - get single registration request
router.get(
    '/requests/:id',
    authenticate,
    (req, res) => employeeRegistrationController.getRegistrationRequest(req, res)
);

// Admin/HR only - approve registration
router.post(
    '/requests/:id/approve',
    authenticate,
    (req, res) => employeeRegistrationController.approveRegistration(req, res)
);

// Admin/HR only - reject registration
router.post(
    '/requests/:id/reject',
    authenticate,
    (req, res) => employeeRegistrationController.rejectRegistration(req, res)
);

// Admin/HR only - get registration statistics
router.get(
    '/stats',
    authenticate,
    (req, res) => employeeRegistrationController.getRegistrationStats(req, res)
);

export default router;
