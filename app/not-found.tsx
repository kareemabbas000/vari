import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[100svh] flex-col items-start justify-center pt-[var(--header-h)]">
      <p className="label text-gold">404</p>
      <h1 className="display h-xl mt-6 max-w-[14ch]">
        This room hasn&apos;t been <span className="display-italic text-gold">built</span> yet.
      </h1>
      <Link href="/" className="btn mt-12">
        <span>Return home</span>
      </Link>
    </section>
  );
}
