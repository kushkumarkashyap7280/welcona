export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        By placing an order on Welcona, you agree to the following terms and conditions. Please read them carefully before making any purchase.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <div className="rounded-xl border border-border/70 bg-card/90 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
            Accurate Information
          </h2>
          <p className="mt-2">
            Customer must provide accurate and complete information while placing an order. Welcona is not responsible for delays or failures caused by incorrect details provided by the customer.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            No Refunds &amp; No Cancellations
          </h2>
          <p className="mt-2">
            Money is <strong className="text-foreground">not refundable</strong> and orders are <strong className="text-foreground">not cancelable</strong> once the order has been placed. Please verify your order carefully before completing checkout.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
            Delivery &amp; Pickup Policy
          </h2>
          <p className="mt-2">
            We do not have delivery partners. Customers can choose one of the following options at checkout:
          </p>
          <ul className="mt-3 space-y-2 ml-1">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><strong className="text-foreground">Customer Pickup:</strong> Come to our shop to collect the product within 7 working days (Mon–Sat, 9 AM – 7 PM). Products not picked up within 7 days will be returned and the money will <strong className="text-foreground">not be refunded</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><strong className="text-foreground">Delhi Delivery:</strong> ₹150 delivery charge. Product will be delivered within 1–5 business days (excluding the day of order).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><strong className="text-foreground">Outside Delhi Delivery:</strong> ₹250 delivery charge. Product will be delivered within 3–5 business days (excluding the day of order).</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Please contact us before purchase if you have questions about delivery.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
            Product Warranty
          </h2>
          <p className="mt-2">
            Warranty duration varies by product — up to 10 years depending on the product type. Please check the individual product page for specific warranty details.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
            Support &amp; Helpline
          </h2>
          <p className="mt-2">
            Our helpline is available from <strong className="text-foreground">9 AM to 7 PM</strong>. We are also available at all times on <strong className="text-foreground">WhatsApp</strong> and <strong className="text-foreground">phone call</strong> for any doubts, or you can email us.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 font-medium text-foreground">📞 9818945601</span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 font-medium text-foreground">💬 WhatsApp: 9625711655</span>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 font-medium text-foreground">✉️ Welconacpfitting@gmail.com</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/50 bg-amber-50/50 dark:border-amber-700/30 dark:bg-amber-950/20 p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
            Important Notice
          </h2>
          <p className="mt-2 text-amber-800 dark:text-amber-300/90">
            By completing your purchase, you acknowledge that you have read, understood, and agree to these terms and conditions. Welcona reserves the right to update these terms periodically. Continued use of the platform indicates acceptance of any updates.
          </p>
        </div>
      </div>
    </section>
  );
}
