export const metadata = {
  title: "About",
  description: "Learn about Welcona — luxury bath fittings.",
};

export default function AboutPage() {
  return (
    <section className="flex flex-col items-center justify-center px-5 py-28 md:py-40 text-center">
      <p className="text-xs tracking-[0.25em] text-primary uppercase font-medium mb-4">
        Our Story
      </p>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-xl">
        About Welcona
      </h1>
      <p className="mt-6 max-w-lg text-muted-foreground">
        We craft premium bath fittings that blend modern engineering with
        timeless design. Coming soon — our full story.
      </p>
    </section>
  );
}
