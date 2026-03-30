import Link from "next/link";

export function LegalPageFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#071109] px-5 py-12 font-sans text-[#EFECE6] sm:px-8 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[#EFECE6]/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#C6D98A] transition-colors hover:border-[#C6D98A]/35 hover:text-[#E8F3BA]"
        >
          На главную страницу
        </Link>

        <div className="mt-10 rounded-[28px] border border-[#EFECE6]/10 bg-[#0C1810] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6D98A]/68">{eyebrow}</div>
          <h1 className="mt-4 font-display text-4xl leading-[0.95] tracking-[-0.04em] text-[#EFECE6] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#EFECE6]/68">{description}</p>
          <div className="mt-8 space-y-6 text-[15px] leading-7 text-[#EFECE6]/82">{children}</div>
        </div>
      </div>
    </main>
  );
}

