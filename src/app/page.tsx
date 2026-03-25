import Link from "next/link";

function ForkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" y1="20" x2="14" y2="20" stroke="#4A6070" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="20" x2="26" y2="10" stroke="#00D4AA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="10" r="3.5" fill="#00D4AA" />
      <line x1="14" y1="20" x2="26" y2="20" stroke="#2A3A4A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-6 backdrop-blur-sm">
      <div className="mb-3 text-accent">{icon}</div>
      <h3 className="mb-2 font-heading text-h3 font-semibold text-text">{title}</h3>
      <p className="text-body leading-relaxed text-text-dim">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 lg:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="FORESIGHT" height={32} className="h-8 w-auto" />
      </header>

      {/* Hero section */}
      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:px-10 lg:py-24">
          {/* Subtle radial glow behind the icon */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
          </div>

          <div className="relative z-10 flex max-w-3xl flex-col items-center gap-8">
            {/* Favicon mark — large, decorative */}
            <ForkIcon className="h-20 w-20 drop-shadow-[0_0_24px_rgba(0,212,170,0.3)]" />

            {/* Heading */}
            <h1 className="font-heading text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
              <span className="text-accent">FORE</span>
              <span className="text-text/65">SIGHT</span>
            </h1>

            {/* Slogan */}
            <p className="font-heading text-xl font-medium text-text-dim sm:text-2xl">
              See what happens before you decide.
            </p>

            {/* Value proposition */}
            <p className="max-w-2xl text-body leading-relaxed text-text-dim sm:text-lg">
              Are you a business owner choosing between two different paths?
              Simulate both scenarios side by side and discover which one brings the
              most value to your business — backed by data, not guesswork.
            </p>

            {/* CTA */}
            <Link
              href="/simulate"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3.5 font-heading text-lg font-semibold text-bg shadow-lg shadow-accent/20 transition-all hover:scale-[1.03] hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:scale-[0.98]"
            >
              Try it out
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638l-3.96-3.96a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.96-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="border-t border-border bg-surface/30 px-6 py-16 lg:px-10 lg:py-20">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z" />
                  <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
                  <path d="m3.265 15.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z" />
                </svg>
              }
              title="Side-by-side simulation"
              description="Describe your business decision, define two paths, and watch both scenarios unfold in parallel with live visualisations."
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3Z" clipRule="evenodd" />
                </svg>
              }
              title="Data-driven insight"
              description="Get clear KPI comparisons, economic impact scores, and AI-generated narratives that help you understand the trade-offs."
            />
            <FeatureCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                  <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                </svg>
              }
              title="Transparent process"
              description="Every step is visible — from input classification to agent reasoning. No black boxes, full trust in the results."
            />
          </div>
        </section>

        {/* Madrid notice */}
        <section className="border-t border-border px-6 py-10 lg:px-10">
          <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-xl border border-gold/30 bg-gold/5 p-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mt-0.5 h-6 w-6 shrink-0 text-gold"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-heading text-body font-semibold text-gold">
                Currently available for Madrid only
              </p>
              <p className="mt-1 text-caption leading-relaxed text-text-dim">
                Our simulation engine is powered by real-world data from the Madrid metropolitan area.
                Support for additional cities is on the roadmap — stay tuned!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-caption text-text-dim lg:px-10">
        <p>&copy; {new Date().getFullYear()} FORESIGHT &mdash; Decision simulation</p>
      </footer>
    </div>
  );
}
