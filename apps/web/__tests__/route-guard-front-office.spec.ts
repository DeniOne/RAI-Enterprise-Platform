import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Front-office access guards', () => {
    it('routes FRONT_OFFICE_USER only to /portal/front-office via middleware', () => {
        const middlewareSource = read('middleware.ts');

        expect(middlewareSource).toContain("role === 'FRONT_OFFICE_USER'");
        expect(middlewareSource).toContain("pathname.startsWith(EXTERNAL_FRONT_OFFICE_BASE_PATH)");
        expect(middlewareSource).toContain('return redirectTo(EXTERNAL_FRONT_OFFICE_BASE_PATH, request);');
    });

    it('uses authenticated principal in (app) layout and blocks anonymous sessions', () => {
        const layoutSource = read('app/(app)/layout.tsx');

        expect(layoutSource).toContain("const user = await getUserData();");
        expect(layoutSource).toContain("redirect('/login');");
        expect(layoutSource).toContain('isExternalFrontOffice={isExternalFrontOfficeUser(user)}');
    });

    it('keeps internal AI shell disabled for external contour', () => {
        const appShellSource = read('components/layouts/AppShell.tsx');

        expect(appShellSource).toContain("effectiveRole === 'FRONT_OFFICE_USER'");
        expect(appShellSource).toContain('if (externalContour) {');
        expect(appShellSource).toContain('<LeftRaiChatDock />');
    });
});
