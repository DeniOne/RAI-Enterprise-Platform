export type NodeType = 'principle' | 'control' | 'metric' | 'component' | 'decision' | 'guideline' | 'concept';
export type NodeStatus = 'draft' | 'review' | 'approved' | 'deprecated';

export interface KnowledgeNode {
    id: string;
    type: NodeType;
    status: NodeStatus;
    owners?: string[];
    source_file: string;
    [key: string]: any;
}

export interface KnowledgeLink {
    source: string;
    target: string;
    type: string;
    source_kind?: string;
    exists_in_docs: boolean;
}

export interface KnowledgeGraph {
    nodes: KnowledgeNode[];
    links: KnowledgeLink[];
    metadata: any;
}

export const semanticQueries = {
    unmeasuredPrinciples: (graph: KnowledgeGraph) => {
        const principles = graph.nodes.filter(n => n.type === 'principle');
        const measuredTargets = new Set(graph.links.filter(l => l.type === 'measured_by').map(l => l.source));
        return principles.filter(p => !measuredTargets.has(p.id));
    },

    controlsWithoutMetrics: (graph: KnowledgeGraph) => {
        const controls = graph.nodes.filter(n => n.type === 'control');
        const measuredByLinks = new Set(graph.links.filter(l => l.type === 'measured_by').map(l => l.source));
        return controls.filter(c => !measuredByLinks.has(c.id));
    },

    approvedWithoutTriad: (graph: KnowledgeGraph) => {
        // Basic check: approved principle must have measured_by relation to an approved metric
        // This is v1, can be expanded
        const approvedNodes = graph.nodes.filter(n => n.status === 'approved');
        return approvedNodes.filter(node => {
            if (node.type === 'principle') {
                const hasMeasurement = graph.links.some(l => l.source === node.id && l.type === 'measured_by');
                return !hasMeasurement;
            }
            if (node.type === 'control') {
                const hasMeasurement = graph.links.some(l => l.source === node.id && l.type === 'measured_by');
                const hasAlignment = graph.links.some(l => l.source === node.id && (l.type === 'aligned_with' || l.type === 'implements'));
                return !hasMeasurement || !hasAlignment;
            }
            return false;
        });
    },

    derivedMetricsInControl: (graph: KnowledgeGraph) => {
        // Derived metrics (total-roi, etc) shouldn't be targets of measured_by for a Control
        const derivedMetrics = new Set(graph.nodes.filter(n => n.derived === true).map(n => n.id));
        return graph.links.filter(l => l.type === 'measured_by' && l.source_kind === 'control' && derivedMetrics.has(l.target));
    },

    orphanNodes: (graph: KnowledgeGraph) => {
        const linkedIds = new Set([
            ...graph.links.map(l => l.source),
            ...graph.links.map(l => l.target)
        ]);
        return graph.nodes.filter(n => !linkedIds.has(n.id));
    }
};
