'use client';

export default function DecisionDetail({ params }: { params: { id: string } }) {
    return (
        <div className="p-8 max-w-4xl mx-auto relative group">
            {/* Absolute Read-Only Layer: Prevent any interaction with inner content */}
            <div className="absolute inset-0 z-50 cursor-default select-none" style={{ background: 'transparent' }} />

            <div className="bg-white border border-black/5 rounded-3xl shadow-2xl overflow-hidden relative grayscale-[0.2]">
                {/* Header with Grain Effect or Pattern */}
                <div className="bg-gray-50 p-10 border-b border-black/5 flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full" />
                            <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Decision Record</h1>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.3em]">
                            Legal Canon // Ref #[{params.id}]
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="px-4 py-1 bg-black text-white text-[10px] font-bold uppercase rounded-full tracking-widest">
                            Immutable Snapshot
                        </div>
                        <p className="text-[9px] text-gray-300 mt-2 font-mono uppercase">Deciphered by RAI Core</p>
                    </div>
                </div>

                <div className="p-12 space-y-12">
                    {/* Legal Stamp Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none text-[120px] font-black uppercase -rotate-12">
                        RECORDED
                    </div>

                    <section className="space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-black/5 pb-2">Contextual Data</h3>
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Company Entity</p>
                                <p className="font-medium">RAI Enterprise Client</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Harvest Plan Reference</p>
                                <p className="font-medium underline decoration-black/10">HP-2026-0042</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-black/5 pb-2">Risk Verdict</h3>
                        <div className="p-6 bg-gray-50 rounded-2xl border border-black/5 font-serif italic text-lg leading-relaxed text-gray-700">
                            "На основании данных о влажности почвы и прогнозируемых осадках, операция посева считается критически допустимой при условии введения дежурства агрономов."
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-black/5 pb-2">Authorized Signatures</h3>
                        <div className="flex justify-between items-end pt-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">System Orchestrator</p>
                                <p className="font-mono text-xs text-gray-300">Hash: 8f4e92...cc01</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-bold uppercase italic">CEO Verified</p>
                                <div className="h-0.5 w-32 bg-black/10 mt-2" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="p-10 bg-black text-white text-[10px] text-center uppercase tracking-[0.5em] font-medium opacity-90">
                    End of Immutable Audit Record
                </div>
            </div>
        </div>
    );
}
