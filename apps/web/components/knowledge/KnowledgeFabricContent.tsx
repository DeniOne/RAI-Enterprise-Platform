"use client";
import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, AlertTriangle, ShieldCheck, Zap, Link, FileText, X, LayoutGrid, Share2 } from 'lucide-react';
import { KnowledgeGraph, KnowledgeNode, semanticQueries } from '../../lib/knowledge/queries';

const GraphView = dynamic(() => import('./GraphView'), { ssr: false });

interface KnowledgePageProps {
    graph: KnowledgeGraph;
}

export default function KnowledgeFabricContent({ graph }: KnowledgePageProps) {
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
    const [activeQuery, setActiveQuery] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

    const filteredNodes = useMemo(() => {
        let result = graph.nodes;

        if (activeQuery === 'unmeasured') {
            const ids = new Set(semanticQueries.unmeasuredPrinciples(graph).map(n => n.id));
            result = result.filter(n => ids.has(n.id));
        } else if (activeQuery === 'controls') {
            const ids = new Set(semanticQueries.controlsWithoutMetrics(graph).map(n => n.id));
            result = result.filter(n => ids.has(n.id));
        } else if (activeQuery === 'notriad') {
            const ids = new Set(semanticQueries.approvedWithoutTriad(graph).map(n => n.id));
            result = result.filter(n => ids.has(n.id));
        } else if (activeQuery === 'orphans') {
            const ids = new Set(semanticQueries.orphanNodes(graph).map(n => n.id));
            result = result.filter(n => ids.has(n.id));
        }

        if (searchQuery) {
            result = result.filter(n =>
                n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (n.source_file && n.source_file.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        return result;
    }, [graph, activeQuery, searchQuery]);

    return (
        <div className="flex h-screen bg-[#F3F3F5] text-[#030213] overflow-hidden font-sans">
            {/* Search & Query Panel */}
            <div className="w-80 border-r border-black/10 bg-white flex flex-col p-6 space-y-8">
                <div>
                    <h1
                        className="text-xl font-medium text-[#030213] mb-6 tracking-tight cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => { setActiveQuery(null); setSearchQuery(''); }}
                    >
                        База Знаний
                    </h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#717182]" />
                        <input
                            type="text"
                            placeholder="Поиск концептов..."
                            className="w-full bg-[#F3F3F5] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all placeholder:text-[#717182]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-2.5 text-[#717182] hover:text-[#030213]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-[11px] font-medium text-[#717182] uppercase tracking-[0.1em] mb-4">Семантический Контроль</h2>
                    <div className="space-y-1.5">
                        <button
                            onClick={() => setActiveQuery(null)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeQuery === null
                                ? 'bg-indigo-600/5 text-indigo-700 font-medium'
                                : 'text-[#717182] hover:bg-[#F3F3F5] hover:text-[#030213]'
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span>Все концепты</span>
                        </button>
                        {[
                            { id: 'unmeasured', label: 'Неизмеримые принципы', icon: Zap },
                            { id: 'controls', label: 'Контроли без метрик', icon: ShieldCheck },
                            { id: 'notriad', label: 'Утверждено без триады', icon: AlertTriangle },
                            { id: 'orphans', label: 'Орфанные узлы', icon: Link },
                        ].map(q => (
                            <button
                                key={q.id}
                                onClick={() => setActiveQuery(activeQuery === q.id ? null : q.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeQuery === q.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-[#717182] hover:bg-[#F3F3F5] hover:text-[#030213]'
                                    }`}
                            >
                                <q.icon className="h-4 w-4" />
                                <span className="font-medium">{q.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="bg-[#F3F3F5] border border-black/5 rounded-2xl p-4">
                        <h3 className="text-[11px] font-medium text-[#717182] uppercase tracking-wider mb-2">Статус Системы</h3>
                        <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs text-[#030213] font-medium tracking-tight">Управление активно</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="p-4 border-b border-black/5 flex justify-between items-center bg-white/80 backdrop-blur-xl z-10">
                    <div className="flex space-x-1 bg-[#F3F3F5] p-1 rounded-xl border border-black/5">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-sm border border-black/5'
                                : 'text-[#717182] hover:text-[#030213]'
                                }`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            <span>Список</span>
                        </button>
                        <button
                            onClick={() => setViewMode('graph')}
                            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'graph'
                                ? 'bg-white text-indigo-600 shadow-sm border border-black/5'
                                : 'text-[#717182] hover:text-[#030213]'
                                }`}
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Граф</span>
                        </button>
                    </div>
                    <div className="text-[10px] text-[#717182] font-mono tracking-widest uppercase">
                        {filteredNodes.length} / {graph.nodes.length} активно
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {viewMode === 'list' ? (
                        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredNodes.map(node => (
                                    <div
                                        key={node.id}
                                        onClick={() => setSelectedNode(node)}
                                        className={`cursor-pointer border transition-all duration-300 p-5 rounded-2xl group relative overflow-hidden ${selectedNode?.id === node.id
                                            ? 'border-indigo-600/50 bg-white ring-1 ring-indigo-600/10 shadow-lg shadow-indigo-600/5'
                                            : 'border-black/5 bg-white hover:border-black/10 hover:shadow-xl hover:shadow-black/5'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-[9px] font-medium uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${node.type === 'principle' ? 'bg-purple-100 text-purple-700' :
                                                node.type === 'control' ? 'bg-blue-100 text-blue-700' :
                                                    node.type === 'metric' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {node.type === 'principle' ? 'Принцип' :
                                                    node.type === 'control' ? 'Контроль' :
                                                        node.type === 'metric' ? 'Метрика' :
                                                            node.type}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                <div className={`h-1 w-1 rounded-full ${node.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                <span className="text-[10px] font-medium text-[#717182] capitalize">
                                                    {node.status === 'approved' ? 'Утверждено' :
                                                        node.status === 'review' ? 'В ожидании' :
                                                            node.status}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-mono text-sm font-medium text-[#030213] mb-1 tracking-tight">
                                            {node.id}
                                        </h3>
                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-black/5">
                                            <div className="flex items-center space-x-2 max-w-[80%]">
                                                <FileText className="h-3.5 w-3.5 text-[#717182]" />
                                                <span className="text-[10px] text-[#717182] font-mono truncate">{node.source_file}</span>
                                            </div>
                                            <div className={`p-1.5 rounded-full transition-colors ${selectedNode?.id === node.id ? 'bg-indigo-600 text-white' : 'bg-[#F3F3F5] text-[#717182] group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                                <Zap className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredNodes.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="inline-flex p-4 rounded-full bg-white border border-black/5 mb-4">
                                            <Search className="h-6 w-6 text-[#717182]" />
                                        </div>
                                        <h3 className="text-lg font-medium text-[#030213]">Концепты не найдены</h3>
                                        <p className="text-sm text-[#717182] mt-1">Попробуйте изменить параметры поиска или фильтры</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white relative">
                            <GraphView
                                graph={graph}
                                onNodeClick={setSelectedNode}
                                highlightNodes={selectedNode
                                    ? new Set([
                                        selectedNode.id,
                                        ...graph.links
                                            .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                                            .map(l => l.source === selectedNode.id ? l.target : l.source)
                                    ])
                                    : new Set(filteredNodes.map(n => n.id))
                                }
                                focusNodeId={selectedNode?.id}
                            />
                            <div className="absolute bottom-6 right-6 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/5 shadow-xl space-y-2">
                                <p className="text-[10px] font-medium text-[#717182] uppercase tracking-widest border-b border-black/5 pb-2 mb-2">Легенда</p>
                                {[
                                    { type: 'principle', color: '#7C3AED' },
                                    { type: 'control', color: '#2563EB' },
                                    { type: 'metric', color: '#059669' },
                                    { type: 'decision', color: '#D97706' },
                                ].map(t => (
                                    <div key={t.type} className="flex items-center space-x-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                        <span className="text-[10px] text-[#030213] font-medium capitalize">
                                            {t.type === 'principle' ? 'Принцип' :
                                                t.type === 'control' ? 'Контроль' :
                                                    t.type === 'metric' ? 'Метрика' :
                                                        t.type === 'decision' ? 'Решение' :
                                                            t.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Inspector Sidebar */}
            {selectedNode && (
                <div className="w-[450px] border-l border-black/5 bg-white flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl relative z-30">
                    <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#F3F3F5]/30">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-base font-medium text-[#030213]">Инспектор Концептов</h2>
                            <button
                                onClick={() => setViewMode('graph')}
                                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                                <Share2 className="h-3.5 w-3.5" />
                                <span>На графе</span>
                            </button>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-[#F3F3F5] rounded-xl transition-colors">
                            <X className="h-5 w-5 text-[#717182]" />
                        </button>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Идентификатор Концепта</label>
                            <div className="font-mono text-xl text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 tracking-tighter">
                                {selectedNode.id}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Тип Уровня</label>
                                <div className="text-sm font-medium text-[#030213] flex items-center space-x-2">
                                    <div className={`h-2 w-2 rounded-full ${selectedNode.type === 'principle' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                    <span>
                                        {selectedNode.type === 'principle' ? 'Принцип' :
                                            selectedNode.type === 'control' ? 'Контроль' :
                                                selectedNode.type === 'metric' ? 'Метрика' :
                                                    selectedNode.type}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Управление</label>
                                <div className="text-sm font-medium text-[#030213] flex items-center space-x-2">
                                    <div className={`h-2 w-2 rounded-full ${selectedNode.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                    <span className="capitalize">
                                        {selectedNode.status === 'approved' ? 'Утверждено' :
                                            selectedNode.status === 'review' ? 'В ожидании' :
                                                selectedNode.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Физическое Расположение</label>
                            <div className="flex items-center space-x-3 text-xs text-[#030213] bg-[#F3F3F5] p-3 rounded-xl border border-black/5 font-mono group cursor-default">
                                <FileText className="h-4 w-4 text-[#717182]" />
                                <span className="truncate">{selectedNode.source_file}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Владельцы</label>
                            <div className="flex flex-wrap gap-2">
                                {selectedNode.owners?.map(o => (
                                    <span key={o} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-[10px] font-medium">{o}</span>
                                )) || <span className="text-[#717182] text-xs italic">Владельцы не назначены</span>}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-black/5">
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-[#717182] font-medium">Semantic Relations</label>
                                <div className="h-px flex-1 mx-4 bg-black/5" />
                                <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                                {graph.links.filter(l => l.source === selectedNode.id).map((l, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] p-3 bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow group">
                                        <span className="text-indigo-600 font-medium px-2 py-0.5 bg-indigo-50 rounded italic">{l.type}</span>
                                        <ArrowRight className="h-3 w-3 text-[#717182]" />
                                        <span className="text-[#030213] font-mono font-medium">{l.target}</span>
                                    </div>
                                ))}
                                {graph.links.filter(l => l.target === selectedNode.id).map((l, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] p-3 bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                                        <span className="text-[#030213] font-mono font-medium">{l.source}</span>
                                        <ArrowRight className="h-3 w-3 text-[#717182]" />
                                        <span className="text-emerald-600 font-medium px-2 py-0.5 bg-emerald-50 rounded italic">{l.type}</span>
                                    </div>
                                ))}
                                {graph.links.filter(l => l.source !== selectedNode.id && l.target !== selectedNode.id).length > 0 &&
                                    graph.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length === 0 && (
                                        <div className="text-center py-4 bg-[#F3F3F5] rounded-xl border border-black/5">
                                            <span className="text-xs text-[#717182] italic">No active relations found</span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
