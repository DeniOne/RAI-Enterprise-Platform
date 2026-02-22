/**
 * @file InstitutionalGraph.ts
 * @description Слой вычисления институциональных зависимостей и путей эскалации.
 * Обеспечивает детерминизм эскалационных маршрутов согласно Invariant-4.3.
 */

export interface DomainNode {
    id: string;
    label: string;
    authority: string;
}

export interface DependencyEdge {
    from: string;
    to: string;
    riskWeight: number;
    escalationRule: 'AUTO' | 'QUORUM_REQUIRED' | 'MANUAL';
}

/**
 * Канонический граф институциональных доменов.
 * В Phase 4 используется для автоматического построения escalationPath.
 */
export const InstitutionalGraph = {
    nodes: [
        { id: 'AGRONOMY', label: 'Агрономия', authority: 'CHIEF_AGRONOMIST' },
        { id: 'FINANCE', label: 'Финансы', authority: 'CFO' },
        { id: 'LEGAL', label: 'Юридический/GR', authority: 'LEGAL_DIRECTOR' },
        { id: 'RISK', label: 'Управление рисками', authority: 'RISK_OFFICER' },
        { id: 'STRATEGY', label: 'Стратегия', authority: 'CEO' },
    ] as DomainNode[],

    edges: [
        { from: 'AGRONOMY', to: 'FINANCE', riskWeight: 0.7, escalationRule: 'QUORUM_REQUIRED' },
        { from: 'FINANCE', to: 'STRATEGY', riskWeight: 0.9, escalationRule: 'QUORUM_REQUIRED' },
        { from: 'AGRONOMY', to: 'RISK', riskWeight: 0.5, escalationRule: 'AUTO' },
        { from: 'RISK', to: 'LEGAL', riskWeight: 0.8, escalationRule: 'QUORUM_REQUIRED' },
        { from: 'LEGAL', to: 'STRATEGY', riskWeight: 1.0, escalationRule: 'QUORUM_REQUIRED' },
    ] as DependencyEdge[],

    getEscalationPath(sourceDomainId: string) {
        const adj = new Map<string, DependencyEdge[]>();
        this.edges.forEach(edge => {
            if (!adj.has(edge.from)) adj.set(edge.from, []);
            adj.get(edge.from)!.push(edge);
        });

        // Invariant-4.3: Сортировка соседей по ID домена для обеспечения детерминизма обхода.
        // Это гарантирует, что BFS всегда выбирает один и тот же путь при наличии нескольких вариантов.
        adj.forEach(edges => {
            edges.sort((a, b) => a.to.localeCompare(b.to));
        });

        const sourceNode = this.nodes.find(n => n.id === sourceDomainId);
        if (!sourceNode) return [];

        const queue: { id: string, path: any[] }[] = [
            {
                id: sourceDomainId,
                path: [{ nodeId: sourceNode.id, authorityRequired: sourceNode.authority, order: 1 }]
            }
        ];

        const visited = new Set<string>();
        visited.add(sourceDomainId);

        while (queue.length > 0) {
            const { id, path } = queue.shift()!;

            // Если дошли до STRATEGY — это терминальный узел власти
            if (id === 'STRATEGY') {
                return path;
            }

            const neighbors = adj.get(id) || [];
            for (const edge of neighbors) {
                if (!visited.has(edge.to)) {
                    visited.add(edge.to);
                    const node = this.nodes.find(n => n.id === edge.to);
                    if (!node) continue;

                    queue.push({
                        id: edge.to,
                        path: [...path, {
                            nodeId: node.id,
                            authorityRequired: node.authority,
                            order: path.length + 1
                        }]
                    });
                }
            }
        }

        return [];
    }
};
