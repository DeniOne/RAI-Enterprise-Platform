import { AuthService } from '../../src/services/auth.service';
import { prisma } from '../../src/config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock bcrypt
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    describe('login', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            first_name: 'John',
            last_name: 'Doe',
            middle_name: null,
            phone_number: null,
            telegram_id: null,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
            avatar: null,
            department_id: null,
            personal_data_consent: true,
            consent_date: new Date(),
            is_profile_complete: true,
            last_login_at: null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should return auth response on valid credentials', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('mock-token');
            (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

            // Act
            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123'
            });

            // Assert
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('test@example.com');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
        });

        it('should throw error on invalid email', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(authService.login({
                email: 'nonexistent@example.com',
                password: 'password123'
            })).rejects.toThrow('Invalid credentials');
        });

        it('should throw error on invalid password', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(authService.login({
                email: 'test@example.com',
                password: 'wrongpassword'
            })).rejects.toThrow('Invalid credentials');
        });
    });

    describe('register', () => {
        it('should create new user and return auth response', async () => {
            // Arrange
            const newUser = {
                id: 'new-user-123',
                email: 'new@example.com',
                password_hash: 'hashed',
                first_name: 'Jane',
                last_name: 'Doe',
                middle_name: null,
                phone_number: null,
                telegram_id: null,
                role: 'EMPLOYEE',
                status: 'ACTIVE',
                avatar: null,
                department_id: null,
                personal_data_consent: true,
                consent_date: new Date(),
                is_profile_complete: true,
                last_login_at: null,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
            (prisma.user.create as jest.Mock).mockResolvedValue(newUser);
            (jwt.sign as jest.Mock).mockReturnValue('mock-token');

            // Act
            const result = await authService.register({
                email: 'new@example.com',
                password: 'Password1!',
                firstName: 'Jane',
                lastName: 'Doe',
                acceptedNDA: true,
                personalDataConsent: true
            });

            // Assert
            expect(result).toHaveProperty('accessToken');
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should throw error if user already exists', async () => {
            // Arrange
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

            // Act & Assert
            await expect(authService.register({
                email: 'existing@example.com',
                password: 'Password1!',
                firstName: 'Jane',
                lastName: 'Doe',
                acceptedNDA: true,
                personalDataConsent: true
            })).rejects.toThrow('User already exists');
        });
    });
});
