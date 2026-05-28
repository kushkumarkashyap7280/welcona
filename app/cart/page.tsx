"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, Trash2, ShoppingBag, ArrowLeft, CreditCard, 
  Truck, CheckCircle, Mail, Phone, MapPin, User, ChevronRight,
  Minus, Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductImage } from "@/components/ui/product-image";

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  retailPrice: number;
  discount: number | null;
  wholesalePrice: number | null;
  wholesaleMinQuantity: number | null;
  image: string;
  quantity: number;
}

export default function GuestCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Checkout Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");

  // Order Confirmed State
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<any>(null);

  // 1. Fetch Cart from LocalStorage & fetch latest prices from database
  const loadCart = async () => {
    try {
      const data = localStorage.getItem("welcona_cart");
      if (!data) {
        setLoading(false);
        return;
      }

      const localItems: CartItem[] = JSON.parse(data);
      if (localItems.length === 0) {
        setCart([]);
        setLoading(false);
        return;
      }

      // Fetch fresh prices from backend in batch
      const productIds = localItems.map(item => item.productId);
      const res = await fetch("/api/products/cart-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });

      if (res.ok) {
        const { products } = await res.json();
        
        // Merge fresh pricing from DB
        const updatedItems = localItems.map(localItem => {
          const freshDbProduct = products.find((p: any) => p.id === localItem.productId);
          if (freshDbProduct) {
            return {
              ...localItem,
              name: freshDbProduct.name,
              sku: freshDbProduct.sku,
              retailPrice: freshDbProduct.retailPrice,
              discount: freshDbProduct.discount,
              wholesalePrice: freshDbProduct.wholesalePrice,
              wholesaleMinQuantity: freshDbProduct.wholesaleMinQuantity,
              // Limit quantity to current database stock level
              quantity: Math.min(localItem.quantity, freshDbProduct.quantity > 0 ? freshDbProduct.quantity : 1),
            };
          }
          return localItem;
        });

        setCart(updatedItems);
        localStorage.setItem("welcona_cart", JSON.stringify(updatedItems));
      } else {
        // Fallback to local storage if API call fails
        setCart(localItems);
      }
    } catch (e) {
      console.error("Failed to sync cart prices with DB:", e);
      // Fallback
      const data = localStorage.getItem("welcona_cart");
      if (data) setCart(JSON.parse(data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // 2. Quantity adjustments
  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem("welcona_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const removeItem = (productId: string) => {
    const updated = cart.filter(item => item.productId !== productId);
    setCart(updated);
    localStorage.setItem("welcona_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    toast.success("Item removed from cart");
  };

  // 3. Price calculations
  const calculateItemPrice = (item: CartItem) => {
    if (
      item.wholesalePrice !== null &&
      item.wholesalePrice !== undefined &&
      item.wholesaleMinQuantity !== null &&
      item.wholesaleMinQuantity !== undefined &&
      item.quantity >= item.wholesaleMinQuantity
    ) {
      return item.wholesalePrice;
    }
    if (item.discount) {
      return item.retailPrice * (1 - item.discount / 100);
    }
    return item.retailPrice;
  };

  const subtotal = cart.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 4. Handle checkout action
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill out all shipping details.");
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === "COD") {
        // Cash on Delivery direct post
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            shippingAddress: address,
            paymentMethod: "CASH_ON_DELIVERY",
            cartItems: cart.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process order.");

        // Clear cart
        localStorage.removeItem("welcona_cart");
        window.dispatchEvent(new Event("cart-updated"));

        setConfirmedOrderDetails(data.order);
        setOrderConfirmed(true);
        toast.success("Order placed successfully!");
      } else {
        // Online Payment with Razorpay
        if (!(window as any).Razorpay) {
          toast.error("Razorpay SDK is loading. Please try again in a moment.");
          setSubmitting(false);
          return;
        }

        // Generate dynamic Razorpay Order ID on server
        const rzpRes = await fetch("/api/checkout/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: cart.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) throw new Error(rzpData.error || "Failed to create payment session.");

        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: "Welcona Bath Fittings",
          description: "Premium Guest Order Checkout",
          order_id: rzpData.orderId,
          handler: async function (response: any) {
            setSubmitting(true);
            try {
              // Verify signature and save order on backend
              const completeRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customerName: name,
                  customerEmail: email,
                  customerPhone: phone,
                  shippingAddress: address,
                  paymentMethod: "ONLINE",
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  cartItems: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                  })),
                }),
              });

              const completeData = await completeRes.json();
              if (!completeRes.ok) throw new Error(completeData.error || "Failed to save payment.");

              localStorage.removeItem("welcona_cart");
              window.dispatchEvent(new Event("cart-updated"));

              setConfirmedOrderDetails(completeData.order);
              setOrderConfirmed(true);
              toast.success("Payment verified and order created!");
            } catch (err: any) {
              toast.error(err.message || "Payment verification failed.");
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: name,
            email: email,
            contact: phone,
          },
          theme: {
            color: "#0f172a",
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              toast.warning("Payment cancelled by customer.");
            }
          }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      }
    } catch (error: any) {
      toast.error(error.message || "Checkout processing error.");
    } finally {
      if (paymentMethod === "COD") {
        setSubmitting(false);
      }
    }
  };

  // ── Success Confirmed View ──
  if (orderConfirmed && confirmedOrderDetails) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16 text-center">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-border/70 bg-card p-5 sm:p-8 shadow-2xl md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
            <CheckCircle className="h-10 w-10" />
          </div>
          
          <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight">Order Confirmed!</h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Thank you for shopping with Welcona. Your luxury fitting order has been placed.
          </p>

          <div className="mt-8 rounded-2xl bg-muted/50 p-4 sm:p-6 text-left space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2.5 text-xs sm:text-sm font-semibold gap-1.5">
              <span className="text-muted-foreground sm:text-foreground">Order Reference ID</span>
              <span className="font-mono text-primary break-all">{confirmedOrderDetails.id}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[10px] sm:text-xs text-muted-foreground">Customer Name</span>
                <span className="font-medium text-foreground wrap-break-word">{confirmedOrderDetails.customerName}</span>
              </div>
              <div>
                <span className="block text-[10px] sm:text-xs text-muted-foreground">Email Receipt</span>
                <span className="font-medium text-foreground break-all">{confirmedOrderDetails.customerEmail}</span>
              </div>
              <div>
                <span className="block text-[10px] sm:text-xs text-muted-foreground">Contact Phone</span>
                <span className="font-medium text-foreground wrap-break-word">{confirmedOrderDetails.customerPhone}</span>
              </div>
              <div>
                <span className="block text-[10px] sm:text-xs text-muted-foreground">Delivery Method</span>
                <span className="font-medium text-foreground uppercase wrap-break-word">{confirmedOrderDetails.paymentMethod}</span>
              </div>
            </div>

            <div className="border-t pt-2.5 text-xs">
              <span className="block text-[10px] sm:text-xs text-muted-foreground">Shipping Address</span>
              <span className="font-medium text-foreground wrap-break-word">{confirmedOrderDetails.shippingAddress}</span>
            </div>

            <div className="border-t pt-2.5 flex justify-between items-center text-sm sm:text-base font-bold">
              <span>Total Price Paid</span>
              <span>{formatPrice(confirmedOrderDetails.total)}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Button size="lg" className="rounded-full px-6 w-full sm:w-auto" onClick={() => router.push("/products")}>
              Continue Shopping
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-6 w-full sm:w-auto" onClick={() => router.push("/")}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading View ──
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground text-sm">Loading cart details...</span>
      </div>
    );
  }

  // ── Empty Cart View ──
  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-[2.5rem] border border-border/70 bg-card p-10 shadow-lg">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/45" />
          <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore our collection of luxury, modern bath fittings to upgrade your spaces.
          </p>
          <Button className="mt-8 w-full rounded-full" onClick={() => router.push("/products")}>
            Browse Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      {/* Razorpay Script integration */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => router.push("/products")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Continue Shopping
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Cart items */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-[2rem] border border-border/70 bg-card overflow-hidden">
            <CardHeader className="py-5">
              <CardTitle className="text-lg">Selected Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {cart.map((item) => {
                const itemPrice = calculateItemPrice(item);
                const isWholesaleApplied = 
                  item.wholesalePrice !== null && 
                  item.wholesalePrice !== undefined &&
                  item.wholesaleMinQuantity !== null &&
                  item.wholesaleMinQuantity !== undefined &&
                  item.quantity >= item.wholesaleMinQuantity;
                
                return (
                  <div key={item.productId} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 sm:items-center">
                    {/* Top Row: Image & Details */}
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-muted border">
                        {item.image ? (
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full"
                            fallbackSize="sm"
                          />
                        ) : (
                          <ShoppingBag className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground opacity-20" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground leading-snug wrap-break-word">{item.name}</h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</p>
                        
                        <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-bold text-foreground">
                            {formatPrice(itemPrice)}
                          </span>
                          {isWholesaleApplied ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              Wholesale Applied
                            </span>
                          ) : item.discount ? (
                            <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                              {formatPrice(item.retailPrice)}
                            </span>
                          ) : null}
                        </div>

                        {item.wholesalePrice !== null && 
                         item.wholesalePrice !== undefined &&
                         item.wholesaleMinQuantity !== null && 
                         item.wholesaleMinQuantity !== undefined && 
                         item.quantity < item.wholesaleMinQuantity && (
                          <p className="text-[10px] sm:text-[11px] text-amber-600 mt-1 font-medium leading-normal">
                            Add {item.wholesaleMinQuantity - item.quantity} more to get wholesale price of {formatPrice(item.wholesalePrice)} each!
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 sm:shrink-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-full border bg-background p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="rounded-full h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-xs sm:text-sm font-semibold">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="rounded-full h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Remove Action */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0 rounded-full h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center border sm:border-0 hover:bg-destructive/5 hover:border-destructive/30"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Checkout Form & Totals */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary */}
          <Card className="rounded-[2rem] border border-border/70 bg-card overflow-hidden">
            <CardHeader className="py-5">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Price</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping / Delivery</span>
                <span className="font-medium text-emerald-600">FREE</span>
              </div>
              
              <div className="border-t pt-4 flex justify-between text-base font-bold text-foreground">
                <span>Grand Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Guest Checkout Form */}
          <Card className="rounded-[2rem] border border-border/70 bg-card overflow-hidden shadow-sm">
            <CardHeader className="py-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Guest Shipping Details
              </CardTitle>
              <CardDescription>We will never ask you to register. Simple guest check out.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Full Shipping Address</Label>
                  <div className="relative">
                    <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      required
                      placeholder="123 Luxury Avenue, Sector 5, Mumbai, Maharashtra - 400001"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-9 min-h-22.5 rounded-xl"
                    />
                  </div>
                </div>

                {/* Payment Option Selector */}
                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-medium">Payment Mode</Label>
                  <div className="grid grid-cols-2 max-[340px]:grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                        paymentMethod === "COD" 
                          ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold" 
                          : "border-border bg-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Truck className="h-5 w-5 mb-1.5" />
                      <span className="text-xs">Cash on Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("RAZORPAY")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                        paymentMethod === "RAZORPAY" 
                          ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold" 
                          : "border-border bg-transparent hover:bg-muted/50"
                      }`}
                    >
                      <CreditCard className="h-5 w-5 mb-1.5" />
                      <span className="text-xs">Pay Online (UPI/Card)</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full rounded-full text-sm font-semibold mt-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Checkout...
                    </>
                  ) : paymentMethod === "COD" ? (
                    "Place COD Order"
                  ) : (
                    "Pay Online & Place Order"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
