
import { PrismaClient } from '@prisma/client';
import { AuthService } from './src/services/auth.service';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START DIAGNOSTIC ---');
    try {
        console.log('Attempting to fetch admin user...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@photomatrix.ru' }
        });

        if (!user) {
            console.log('No users found in database.');
        } else {
            console.log('User fetched successfully.');
            console.log('User ID:', user.id);
            console.log('User Email:', user.email);

            // @ts-ignore
            console.log('foundation_status value:', user['foundation_status']);
            // @ts-ignore
            console.log('must_reset_password value:', user['must_reset_password']);

            console.log('\n>>> ATTEMPTING AUTH SERVICE LOGIN <<<');
            const authService = new AuthService();
            try {
                const result = await authService.login({
                    email: 'admin@photomatrix.ru',
                    password: 'admin123'
                });
                console.log('LOGIN SUCCESSFUL!');
                console.log('Result payload:', JSON.stringify(result, null, 2));
            } catch (loginError: any) {
                console.error('!!! LOGIN FAILED !!!');
                console.error('Error message:', loginError.message);
                console.error('Stack trace:', loginError.stack);
            }
        }
    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- END DIAGNOSTIC ---');
    }
}

main();
