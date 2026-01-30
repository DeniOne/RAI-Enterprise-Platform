/**
 * ACL Integration Tests for Telegram Adapter
 * 
 * Tests ACL middleware integration in MG Chat execution flow.
 */

import { processTextMessage, processCallback } from '../integration/telegram.adapter';
import { AccessContext } from '../../../access/mg-chat-acl';
import { MGChatError } from '../errors';

describe('ACL Integration in Telegram Adapter', () => {
    describe('processTextMessage', () => {
        test('employee + employee intent → allowed', () => {
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            const result = processTextMessage('мои задачи', accessContext);

            expect(result).toBeDefined();
            expect(result.text).toContain('Твои текущие задачи');
        });

        test('employee + manager intent → ACL_FORBIDDEN', () => {
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            expect(() => {
                processTextMessage('статус смены', accessContext);
            }).toThrow(MGChatError);

            try {
                processTextMessage('статус смены', accessContext);
            } catch (error) {
                expect(error).toBeInstanceOf(MGChatError);
                expect((error as MGChatError).errorCode).toBe('ACL_FORBIDDEN');
            }
        });

        test('manager + wrong scope → ACL_OUT_OF_SCOPE', () => {
            const accessContext: AccessContext = {
                userId: 'user2',
                roles: ['MANAGER'],
                contour: 'manager',
                scope: 'self'  // Wrong scope for manager intents
            };

            expect(() => {
                processTextMessage('статус смены', accessContext);
            }).toThrow(MGChatError);

            try {
                processTextMessage('статус смены', accessContext);
            } catch (error) {
                expect(error).toBeInstanceOf(MGChatError);
                expect((error as MGChatError).errorCode).toBe('ACL_OUT_OF_SCOPE');
            }
        });

        test('manager + correct scope → allowed', () => {
            const accessContext: AccessContext = {
                userId: 'user2',
                roles: ['MANAGER'],
                contour: 'manager',
                scope: 'own_unit'
            };

            const result = processTextMessage('статус смены', accessContext);

            expect(result).toBeDefined();
            expect(result.text).toContain('Статус текущей смены');
        });
    });

    describe('processCallback', () => {
        test('callback flow with ACL check → allowed', () => {
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            const result = processCallback('employee.show_my_tasks', accessContext);

            expect(result).toBeDefined();
            expect(result.text).toContain('Твои текущие задачи');
        });

        test('callback flow with ACL check → FORBIDDEN', () => {
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            expect(() => {
                processCallback('manager.show_shift_status', accessContext);
            }).toThrow(MGChatError);

            try {
                processCallback('manager.show_shift_status', accessContext);
            } catch (error) {
                expect(error).toBeInstanceOf(MGChatError);
                expect((error as MGChatError).errorCode).toBe('ACL_FORBIDDEN');
            }
        });
    });

    describe('Architecture Guarantees', () => {
        test('ACL check happens after Intent Resolution', () => {
            // This is verified by the fact that ACL errors are thrown
            // only when intent is resolved successfully
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            // Unknown intent → fallback (no ACL check)
            const result1 = processTextMessage('абракадабра', accessContext);
            expect(result1.text).toContain('Я не понял запрос');

            // Known intent but forbidden → ACL error
            expect(() => {
                processTextMessage('статус смены', accessContext);
            }).toThrow(MGChatError);
        });

        test('ACL does not format UX', () => {
            // ACL throws MGChatError with error code
            // UX formatting happens in Error UX Interceptor
            const accessContext: AccessContext = {
                userId: 'user1',
                roles: ['EMPLOYEE'],
                contour: 'employee',
                scope: 'self'
            };

            try {
                processTextMessage('статус смены', accessContext);
                fail('Should have thrown MGChatError');
            } catch (error) {
                expect(error).toBeInstanceOf(MGChatError);
                expect((error as MGChatError).errorCode).toBe('ACL_FORBIDDEN');
                // Error does NOT contain UX text
                expect((error as MGChatError).message).not.toContain('У вас нет доступа');
            }
        });
    });
});
