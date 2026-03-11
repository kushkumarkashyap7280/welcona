export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-2 text-muted-foreground">
        Track and manage your orders.
      </p>
      <div className="mt-8 luxury-card text-center py-12">
        <p className="text-muted-foreground">No orders yet.</p>
      </div>
    </div>
  );
}
