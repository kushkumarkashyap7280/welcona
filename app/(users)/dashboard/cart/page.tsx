export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Cart</h1>
      <p className="mt-2 text-muted-foreground">
        Review items in your cart before checkout.
      </p>
      <div className="mt-8 luxury-card text-center py-12">
        <p className="text-muted-foreground">Your cart is empty.</p>
      </div>
    </div>
  );
}
