import Logo from '@/components/Logo';

/** Centered card used by the sign-in screens. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="blueprint flex min-h-[100svh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo className="h-auto w-[120px]" sizes="120px" priority />
        </div>
        <div className="rounded-sm border border-bone/10 bg-[#141312]/95 p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-gold">Control panel</p>
          <h1 className="mt-2 font-display text-[1.9rem] leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-bone/55">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
