export const metadata = {
  title: "Products",
  description: "Browse Welcona's luxury bath fittings collection.",
};

export default function ProductsPage() {
  return (
    <section className="flex flex-col items-center justify-center px-5 py-28 md:py-40 text-center">
      <p className="text-xs tracking-[0.25em] text-primary uppercase font-medium mb-4">
        Collection
      </p>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
        Our Products
      </h1>
      <p className="mt-6 max-w-lg text-muted-foreground">
        Explore our curated range of premium bath fittings. Full catalog coming
        soon.
      </p>
    </section>
  );
}
