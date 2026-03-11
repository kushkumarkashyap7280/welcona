import Link from "next/link";

export const metadata = {
  title: "Home",
  description: "Luxury bath fittings crafted by Welcona.",
};

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center px-5 py-28 md:py-40 text-center">
      <p className="text-xs tracking-[0.25em] text-primary uppercase font-medium mb-4">
        Premium Bath Fittings
      </p>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl leading-[1.1]">
        Elevate Your
        <span className="text-primary"> Bathroom</span>
        <br />
        Experience
      </h1>
      <p className="mt-6 max-w-lg text-muted-foreground text-base md:text-lg">
        Discover Welcona&apos;s curated collection of luxury bath fittings —
        crafted with precision, designed for modern living.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Explore Products
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-3 text-sm font-semibold transition hover:bg-muted"
        >
          Create Account
        </Link>
      </div>
    </section>
  );
}
