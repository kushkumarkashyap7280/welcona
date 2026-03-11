export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">
        Your Welcona dashboard — manage orders, cart, and account settings.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Orders", value: "0", desc: "Total orders placed" },
          { title: "Cart", value: "0", desc: "Items in your cart" },
          { title: "Account", value: "Active", desc: "Account status" },
        ].map((card) => (
          <div key={card.title} className="luxury-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {card.title}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
