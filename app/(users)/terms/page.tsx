export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        These terms govern your use of Welcona services. By using the website, you agree to these conditions.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">Use of Service</h2>
          <p className="mt-2">
            You agree to use the website lawfully and not to misuse any functionality or content.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Orders and Payments</h2>
          <p className="mt-2">
            Product availability, pricing, and order acceptance are subject to change and verification.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Intellectual Property</h2>
          <p className="mt-2">
            Site content, branding, and assets are protected and may not be reused without permission.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Changes to Terms</h2>
          <p className="mt-2">
            We may update these terms periodically. Continued use of the platform indicates acceptance of updates.
          </p>
        </div>
      </div>
    </section>
  );
}
