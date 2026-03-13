import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) =>
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Front-Office smoke contract', () => {
    it('keeps the front-office shell and core sections wired', () => {
        const layout = read('app/(app)/front-office/layout.tsx');
        const page = read('app/(app)/front-office/page.tsx');
        const contextPage = read('app/(app)/front-office/context/page.tsx');
        const taskDetailPage = read('app/(app)/front-office/tasks/[id]/page.tsx');

        expect(layout).toContain('Операционный центр');
        expect(layout).toContain('/front-office/deviations');
        expect(layout).toContain('/front-office/context');

        expect(page).toContain('Операционные задачи');
        expect(page).toContain('Новый ingress');
        expect(page).toContain('Требует привязки');
        expect(page).toContain('Требует уточнения');
        expect(page).toContain('Готово к подтверждению');
        expect(page).toContain('Отклонения');
        expect(page).toContain('Последние сигналы');

        expect(taskDetailPage).toContain('Evidence / Observations');
        expect(contextPage).toContain('Консультации');
        expect(contextPage).toContain('Обновления контекста');
    });

    it('keeps server API adapters aligned to front-office endpoints', () => {
        const api = read('lib/api/front-office-server.ts');
        const workspacePage = read('app/telegram/workspace/page.tsx');

        expect(api).toContain('"/front-office/overview"');
        expect(api).toContain('"/front-office/deviations"');
        expect(api).toContain('"/front-office/consultations"');
        expect(api).toContain('"/front-office/context-updates"');
        expect(api).toContain('"/front-office/manager/bootstrap"');
        expect(api).toContain('"/front-office/manager/farms"');
        expect(api).toContain('`/field-observation/task/${id}`');
        expect(api).toContain('"/seasons"');
        expect(workspacePage).toContain('TelegramWorkspaceClient');
    });
});
