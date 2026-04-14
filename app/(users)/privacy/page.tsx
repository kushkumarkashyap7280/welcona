export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        We value your privacy. This page outlines how Welcona collects, uses, and protects your personal information.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-muted-foreground">
        <div>
          <h2 className="text-base font-semibold text-foreground">Information We Collect</h2>
          <p className="mt-2">
            We may collect account details, order information, and basic usage data to operate and improve our services.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">How We Use Information</h2>
          <p className="mt-2">
            Your information is used for account authentication, order fulfillment, support, and service quality improvements.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Data Security</h2>
          <p className="mt-2">
            We apply reasonable technical and organizational safeguards to protect your data.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            For privacy-related questions, contact the Welcona support team.
          </p>
        </div>
      </div>
    </section>
  );
}
