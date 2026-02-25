import React from 'react';
import KnowledgeFabricContent from '../../../components/knowledge/KnowledgeFabricContent';

async function getGraph() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/knowledge/graph`, {
        cache: 'no-store'
    });
    if (!res.ok) {
        throw new Error('Failed to fetch graph');
    }
    return res.json();
}

export default async function KnowledgePage() {
    try {
        const graph = await getGraph();
        return <KnowledgeFabricContent graph={graph} />;
    } catch (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 p-8 text-center">
                <div>
                    <h1 className="text-2xl font-medium text-gray-900 mb-2">Данные графа недоступны</h1>
                    <p className="max-w-md">
                        Please ensure the API is running and the graph snapshot has been generated using <code className="bg-gray-100 px-1 rounded text-gray-800">scripts/generate_graph.py</code>.
                    </p>
                </div>
            </div>
        );
    }
}
