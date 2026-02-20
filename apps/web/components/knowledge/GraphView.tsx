"use client";

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
import { KnowledgeGraph, KnowledgeNode } from '../../lib/knowledge/queries';

interface GraphViewProps {
    graph: KnowledgeGraph;
    onNodeClick: (node: KnowledgeNode) => void;
    highlightNodes?: Set<string>;
    focusNodeId?: string | null;
}

export default function GraphView({ graph, onNodeClick, highlightNodes, focusNodeId }: GraphViewProps) {
    const fgRef = useRef<any>();

    useEffect(() => {
        if (focusNodeId && fgRef.current) {
            const node = graph.nodes.find(n => n.id === focusNodeId);
            if (node) {
                // Delay slightly to ensure graph layout is stable or if mounting
                setTimeout(() => {
                    const { x, y } = node as any;
                    if (x !== undefined && y !== undefined) {
                        fgRef.current.centerAt(x, y, 1000);
                        fgRef.current.zoom(6, 1000);
                    }
                }, 100);
            }
        }
    }, [focusNodeId, graph.nodes]);

    const data = {
        nodes: graph.nodes.map(n => ({
            ...n,
            name: n.id,
            val: n.type === 'principle' ? 5 : 3
        })),
        links: graph.links.map(l => ({
            source: l.source,
            target: l.target,
            label: l.type
        }))
    };

    return (
        <div className="w-full h-full bg-white relative">
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel="id"
                nodeColor={(node: any) => {
                    const isHighlighted = highlightNodes && highlightNodes.has(node.id);
                    if (!isHighlighted) return '#E2E8F0'; // Muted for non-highlighted

                    switch (node.type) {
                        case 'principle': return '#7C3AED'; // Purple-600
                        case 'control': return '#2563EB';   // Blue-600
                        case 'metric': return '#059669';    // Emerald-600
                        case 'decision': return '#D97706';  // Amber-600
                        default: return '#64748b';
                    }
                }}
                linkColor={() => '#E2E8F0'}
                linkDirectionalArrowLength={2}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node: any) => onNodeClick(node)}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link: any, ctx: any) => {
                    const MAX_FONT_SIZE = 3;
                    const start = link.source;
                    const end = link.target;

                    if (typeof start !== 'object' || typeof end !== 'object') return;

                    const textPos = {
                        x: start.x + (end.x - start.x) / 2,
                        y: start.y + (end.y - start.y) / 2
                    };

                    const relLink = { x: end.x - start.x, y: end.y - start.y };
                    let textAngle = Math.atan2(relLink.y, relLink.x);
                    if (textAngle > Math.PI / 2) textAngle -= Math.PI;
                    if (textAngle < -Math.PI / 2) textAngle += Math.PI;

                    const label = link.label;

                    ctx.font = `500 ${MAX_FONT_SIZE}px Geist Sans`;
                    ctx.save();
                    ctx.translate(textPos.x, textPos.y);
                    ctx.rotate(textAngle);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#94A3B8';
                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                }}
            />
        </div>
    );
}
