import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { threadId, message, context } = body;

        // Имитация вычислений LLM / задержки
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Простая логика мока
        let assistantMessage = `Я получил ваше сообщение: "${message}".`;
        let riskLevel = 'R1';
        let suggestedActions: any[] = [];

        // Имитация осведомленности о контексте
        if (context?.route) {
            assistantMessage += ` \nЯ вижу, что вы находитесь на странице: ${context.route}.`;
        }

        if (context?.entityId) {
            assistantMessage += ` \nАктивная сущность: ${context.entityId}.`;
        }

        // Имитация классификатора рисков F-уровня/Governance E-уровня
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('удалить') || lowerMsg.includes('сбросить') || lowerMsg.includes('delete')) {
            riskLevel = 'R3'; // Требует кворума
            assistantMessage = 'Внимание! Операция удаления требует утверждения (Qourum Flow). Я сформировал черновик действия, но не могу выполнить его напрямую.';
            suggestedActions = [
                { type: 'CREATE_DRAFT', target: 'GovernanceFlow', payload: { action: 'DELETE', targetId: context?.entityId } }
            ];
        } else if (lowerMsg.includes('ошибка') || lowerMsg.includes('баг')) {
            riskLevel = 'R2';
        } else if (lowerMsg.includes('привет')) {
            riskLevel = 'R0';
            assistantMessage = 'Привет! Я RAI AI-Ассистент. Чем могу помочь?';
        }

        const responseThreadId = threadId || `th_${Math.random().toString(36).substring(2, 9)}`;

        return NextResponse.json({
            threadId: responseThreadId,
            assistantMessage,
            riskLevel,
            suggestedActions
        });

    } catch (error) {
        console.error('[AiChat API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
