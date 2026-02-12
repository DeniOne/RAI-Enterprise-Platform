'use client';

import React from 'react';
import { AdvisoryLevel, AdvisoryTrend } from '@/lib/api/strategic';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvisoryRadarProps {
    score: number;
    level: AdvisoryLevel;
    trend: AdvisoryTrend;
    sources: string[];
    message: string;
    confidence: number;
}

export const AdvisoryRadar: React.FC<AdvisoryRadarProps> = ({
    score,
    level,
    trend,
    sources,
    message,
    confidence
}) => {
    const size = 200;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (lvl: AdvisoryLevel) => {
        switch (lvl) {
            case AdvisoryLevel.HIGH: return '#FF005C'; // Neon Pink/Red
            case AdvisoryLevel.MEDIUM: return '#FFD600'; // Yellow
            case AdvisoryLevel.LOW: return '#00F0FF'; // Cyan
            default: return '#FFFFFF';
        }
    };

    const color = getColor(level);

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col lg:flex-row gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* SVG Gauge */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        className="text-white/[0.05]"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                    <span className="text-5xl font-light tracking-tighter" style={{ color }}>
                        {score}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Index</span>
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="space-y-2">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <h2 className="text-3xl font-light tracking-tight">{message}</h2>
                        {trend === AdvisoryTrend.IMPROVING && <TrendingUp size={24} className="text-emerald-500" />}
                        {trend === AdvisoryTrend.WORSENING && <TrendingDown size={24} className="text-rose-500" />}
                        {trend === AdvisoryTrend.STABLE && <Minus size={24} className="opacity-40" />}
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{level} LEVEL</span>
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-medium">Confidence: {Math.round(confidence * 100)}%</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center lg:justify-start gap-2 opacity-40">
                        <Info size={12} />
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Explainability Sources</span>
                    </div>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                        {sources.length > 0 ? sources.map(source => (
                            <span key={source} className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] uppercase tracking-widest font-semibold">
                                {source.replace(/_/g, ' ')}
                            </span>
                        )) : (
                            <span className="text-sm opacity-20 italic font-light">No critical anomalies detected</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
