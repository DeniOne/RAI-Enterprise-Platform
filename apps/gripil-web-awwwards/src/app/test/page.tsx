import { TransitionLink } from "@/components/TransitionLink";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#06080b] text-white flex flex-col items-center justify-center gap-8 font-sans">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.22em] text-white/40 mb-4">Тестовая страница перехода</div>
        <h1 className="text-6xl font-light mb-2">Переход работает</h1>
        <p className="text-white/60 text-lg">Шторка открылась, контент появился плавно</p>
      </div>
      <TransitionLink 
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 hover:border-[#CDFF00] hover:text-[#CDFF00] transition-colors duration-300"
      >
        ← Назад на главную
      </TransitionLink>
    </div>
  );
}
