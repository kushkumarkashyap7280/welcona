"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Trash2, ShoppingBag, CreditCard,
  CheckCircle, Mail, Phone, MapPin, User,
  Minus, Plus, X, Store, Truck, MapPinned,
  FileText, ExternalLink, AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  availableStock?: number; // live stock from DB
}

interface StockIssue {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

type DeliveryOption = "CUSTOMER_PICKUP" | "DELHI" | "OUTSIDE_DELHI";

const DELIVERY_OPTIONS: { value: DeliveryOption; label: string; desc: string; charge: number; icon: typeof Store }[] = [
  { value: "CUSTOMER_PICKUP", label: "Customer Pickup", desc: "Pick up from our shop within 7 working days (Mon–Sat, 9 AM – 7 PM). Otherwise product returned, money not refunded.", charge: 0, icon: Store },
  { value: "DELHI", label: "Delhi Delivery", desc: "Delivered within 1–5 business days.", charge: 150, icon: Truck },
  { value: "OUTSIDE_DELHI", label: "Outside Delhi", desc: "Delivered within 3–5 business days.", charge: 250, icon: MapPinned },
];

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [validatingStock, setValidatingStock] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("CUSTOMER_PICKUP");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Checkout step: "cart" | "checkout" | "confirmed"
  const [step, setStep] = useState<"cart" | "checkout" | "confirmed">("cart");
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const loadCart = useCallback(async () => {
    try {
      const data = localStorage.getItem("welcona_cart");
      if (!data) { setLoading(false); return; }
      const localItems: CartItem[] = JSON.parse(data);
      if (localItems.length === 0) { setCart([]); setLoading(false); return; }

      const productIds = localItems.map(item => item.productId);
      const res = await fetch("/api/products/cart-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });

      if (res.ok) {
        const { products } = await res.json();
        const issues: StockIssue[] = [];
        const updatedItems: CartItem[] = [];

        for (const localItem of localItems) {
          const fresh = products.find((p: any) => p.id === localItem.productId);
          if (!fresh) {
            // Product deleted from DB — auto-remove
            toast.error(`"${localItem.name}" is no longer available and was removed from your cart.`);
            continue;
          }
          if (fresh.quantity === 0) {
            // Out of stock — auto-remove
            toast.error(`"${fresh.name}" is out of stock and was removed from your cart.`);
            continue;
          }
          const cappedQty = Math.min(localItem.quantity, fresh.quantity);
          if (localItem.quantity > fresh.quantity) {
            issues.push({ productId: fresh.id, name: fresh.name, requested: localItem.quantity, available: fresh.quantity });
          }
          updatedItems.push({
            ...localItem, name: fresh.name, sku: fresh.sku,
            retailPrice: fresh.retailPrice, discount: fresh.discount,
            wholesalePrice: fresh.wholesalePrice, wholesaleMinQuantity: fresh.wholesaleMinQuantity,
            quantity: cappedQty, availableStock: fresh.quantity,
          });
        }

        setCart(updatedItems);
        setStockIssues(issues);
        localStorage.setItem("welcona_cart", JSON.stringify(updatedItems));
        if (updatedItems.length < localItems.length) {
          window.dispatchEvent(new Event("cart-updated"));
        }
      } else {
        setCart(localItems);
      }
    } catch {
      const data = localStorage.getItem("welcona_cart");
      if (data) setCart(JSON.parse(data));
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate stock for all cart items — used before checkout transitions
  const validateStock = useCallback(async (currentCart: CartItem[]): Promise<{ valid: boolean; issues: StockIssue[] }> => {
    try {
      setValidatingStock(true);
      const res = await fetch("/api/products/validate-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: currentCart.map(i => ({ productId: i.productId, quantity: i.quantity, name: i.name })) }),
      });
      const data = await res.json();
      if (!res.ok) return { valid: false, issues: [] };

      // Auto-remove items with 0 stock
      const zeroStockIds = (data.stockIssues as StockIssue[]).filter(si => si.available === 0).map(si => si.productId);
      if (zeroStockIds.length > 0) {
        const cleaned = currentCart.filter(i => !zeroStockIds.includes(i.productId));
        setCart(cleaned);
        localStorage.setItem("welcona_cart", JSON.stringify(cleaned));
        window.dispatchEvent(new Event("cart-updated"));
        for (const si of data.stockIssues.filter((s: StockIssue) => s.available === 0)) {
          toast.error(`"${si.name}" is out of stock and was removed.`);
        }
      }

      // Cap quantities for items with partial stock
      const partialIssues = (data.stockIssues as StockIssue[]).filter(si => si.available > 0);
      if (partialIssues.length > 0) {
        const updated = currentCart.filter(i => !zeroStockIds.includes(i.productId)).map(i => {
          const issue = partialIssues.find(si => si.productId === i.productId);
          if (issue) return { ...i, quantity: issue.available, availableStock: issue.available };
          return i;
        });
        setCart(updated);
        localStorage.setItem("welcona_cart", JSON.stringify(updated));
      }

      setStockIssues(data.stockIssues || []);
      return { valid: data.valid, issues: data.stockIssues || [] };
    } catch {
      return { valid: false, issues: [] };
    } finally {
      setValidatingStock(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setLoading(true); loadCart(); }
  }, [open, loadCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.productId !== productId) return item;
      const maxQty = item.availableStock ?? Infinity;
      const newQty = Math.max(1, Math.min(maxQty, item.quantity + delta));
      if (newQty === item.quantity && delta > 0) {
        toast.warning(`Only ${maxQty} units available for "${item.name}"`);
      }
      return { ...item, quantity: newQty };
    });
    setCart(updated);
    setStockIssues(prev => prev.filter(si => si.productId !== productId)); // Clear resolved issues
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

  const calculateItemPrice = (item: CartItem) => {
    if (item.wholesalePrice != null && item.wholesaleMinQuantity != null && item.quantity >= item.wholesaleMinQuantity)
      return item.wholesalePrice;
    if (item.discount) return item.retailPrice * (1 - item.discount / 100);
    return item.retailPrice;
  };

  const subtotal = cart.reduce((sum, item) => sum + calculateItemPrice(item) * item.quantity, 0);
  const deliveryCharge = DELIVERY_OPTIONS.find(d => d.value === deliveryOption)?.charge ?? 0;
  const grandTotal = subtotal + deliveryCharge;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill out all shipping details."); return;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions."); return;
    }

    setSubmitting(true);
    try {
      if (!(window as any).Razorpay) {
        toast.error("Razorpay SDK is loading. Please try again in a moment.");
        setSubmitting(false); return;
      }

      // Re-validate stock one final time before payment
      const stockCheck = await validateStock(cart);
      if (!stockCheck.valid) {
        const issueNames = stockCheck.issues.map(si =>
          si.available === 0 ? `"${si.name}" (out of stock)` : `"${si.name}" (only ${si.available} available)`
        ).join(", ");
        toast.error(`Stock issue: ${issueNames}. Cart has been updated.`);
        setSubmitting(false);
        return;
      }

      const rzpRes = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryOption,
          cartItems: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        // Handle stock issues from backend
        if (rzpData.stockIssues) {
          setStockIssues(rzpData.stockIssues);
          const names = rzpData.stockIssues.map((si: StockIssue) =>
            si.available === 0 ? `"${si.name}" (out of stock)` : `"${si.name}" (only ${si.available} available)`
          ).join(", ");
          toast.error(`Cannot proceed: ${names}`);
          setSubmitting(false);
          return;
        }
        throw new Error(rzpData.error || "Failed to create payment session.");
      }

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
            const completeRes = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerName: name, customerEmail: email, customerPhone: phone,
                shippingAddress: address, deliveryOption,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                cartItems: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
              }),
            });
            const completeData = await completeRes.json();
            if (!completeRes.ok) throw new Error(completeData.error || "Failed to save payment.");

            localStorage.removeItem("welcona_cart");
            window.dispatchEvent(new Event("cart-updated"));
            setConfirmedOrder(completeData.order);
            setStep("confirmed");
            toast.success("Payment verified and order created!");
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.warning("Payment cancelled.");
          },
        },
      };
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      toast.error(error.message || "Checkout processing error.");
    } finally {
      // submitting stays true until Razorpay handler resolves
    }
  };

  if (!open) return <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayLoaded(true)} />;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayLoaded(true)} />
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-[61] flex h-full w-full max-w-md flex-col bg-background shadow-2xl border-l border-border/60 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {step === "confirmed" ? "Order Confirmed" : step === "checkout" ? "Checkout" : "Your Cart"}
          </h2>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ── CONFIRMED VIEW ── */}
          {step === "confirmed" && confirmedOrder && (
            <div className="text-center space-y-5 py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">Order Confirmed!</h3>
              <p className="text-sm text-muted-foreground">Thank you for shopping with Welcona.</p>
              <div className="rounded-xl bg-muted/50 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono font-medium">{confirmedOrder.id?.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{confirmedOrder.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-bold">{formatPrice(confirmedOrder.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{confirmedOrder.deliveryOption?.replace(/_/g, " ")}</span></div>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full rounded-full" onClick={() => { onClose(); router.push("/products"); }}>Continue Shopping</Button>
                <Button variant="outline" className="w-full rounded-full" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}

          {/* ── LOADING ── */}
          {step !== "confirmed" && loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading cart...</span>
            </div>
          )}

          {/* ── EMPTY CART ── */}
          {step !== "confirmed" && !loading && cart.length === 0 && (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">Browse our collection to find something you love.</p>
              <Button className="mt-6 rounded-full" onClick={() => { onClose(); router.push("/products"); }}>Browse Products</Button>
            </div>
          )}

          {/* ── CART ITEMS (step: cart) ── */}
          {step === "cart" && !loading && cart.length > 0 && (
            <div className="space-y-3">
              {cart.map(item => {
                const price = calculateItemPrice(item);
                return (
                  <div key={item.productId} className="flex gap-3 rounded-xl border border-border/60 bg-card/80 p-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted border">
                      {item.image ? (
                        <ProductImage src={item.image} alt={item.name} className="object-cover w-full h-full" fallbackSize="sm" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 absolute inset-0 m-auto text-muted-foreground opacity-20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold">{formatPrice(price)}</span>
                        {item.discount && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(item.retailPrice)}</span>}
                      </div>

                      {item.wholesalePrice !== null && item.wholesaleMinQuantity !== null && (
                        <div className="mt-1">
                          {item.quantity < item.wholesaleMinQuantity ? (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md inline-block">
                              Add {item.wholesaleMinQuantity - item.quantity} more for Wholesale price (Save {formatPrice(item.retailPrice - item.wholesalePrice)}/pc)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md inline-block">
                              🎉 Wholesale price unlocked! ({formatPrice(item.wholesalePrice)}/pc)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center rounded-full border bg-background p-0.5">
                        <button className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted" onClick={() => updateQuantity(item.productId, -1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                        <button className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted" onClick={() => updateQuantity(item.productId, 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── STOCK ISSUES WARNING ── */}
          {step === "cart" && !loading && stockIssues.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">Stock Issues</span>
              </div>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 pl-6 list-disc">
                {stockIssues.map(si => (
                  <li key={si.productId}>
                    <strong>{si.name}</strong>: requested {si.requested}, only <strong>{si.available}</strong> available
                    {si.available === 0 && " (removed)"}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-600 dark:text-amber-500">Quantities have been adjusted. Please review your cart.</p>
            </div>
          )}

          {/* ── CHECKOUT FORM (step: checkout) ── */}
          {step === "checkout" && !loading && cart.length > 0 && (
            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Delivery Options */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Delivery Option</Label>
                {DELIVERY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeliveryOption(opt.value)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        deliveryOption === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-transparent hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{opt.label}</span>
                          <span className="text-sm font-bold">{opt.charge > 0 ? formatPrice(opt.charge) : "FREE"}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Customer Details */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold">Your Details</Label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input id="cart-name" required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input id="cart-email" type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input id="cart-phone" type="tel" required placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="cart-address" required placeholder="Full Shipping Address" value={address} onChange={e => setAddress(e.target.value)} className="pl-9 min-h-20 rounded-xl" />
                </div>
              </div>

              {/* T&C Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="terms-agree" className="text-xs text-muted-foreground leading-relaxed">
                  I have read and agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2 font-medium inline-flex items-center gap-0.5">
                    Terms & Conditions <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Items ({cart.length})</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{deliveryCharge > 0 ? formatPrice(deliveryCharge) : "FREE"}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Grand Total</span><span>{formatPrice(grandTotal)}</span></div>
              </div>

              <Button type="submit" size="lg" disabled={submitting || !agreedToTerms} className="w-full rounded-full text-sm font-semibold">
                {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (<><CreditCard className="mr-2 h-4 w-4" />Pay {formatPrice(grandTotal)} Online</>)}
              </Button>
            </form>
          )}
        </div>

        {/* Footer (cart step only) */}
        {step === "cart" && !loading && cart.length > 0 && (
          <div className="border-t border-border/60 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({cart.length} items)</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>
            <Button
              className="w-full rounded-full font-semibold"
              size="lg"
              disabled={validatingStock || stockIssues.length > 0}
              onClick={async () => {
                const result = await validateStock(cart);
                if (result.valid) {
                  setStep("checkout");
                } else {
                  const issueNames = result.issues.map(si =>
                    si.available === 0 ? `"${si.name}" (out of stock)` : `"${si.name}" (only ${si.available} available)`
                  ).join(", ");
                  toast.error(`Stock issue: ${issueNames}. Cart has been updated.`);
                }
              }}
            >
              {validatingStock ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking stock...</>) : "Proceed to Checkout"}
            </Button>
          </div>
        )}

        {/* Back button (checkout step) */}
        {step === "checkout" && (
          <div className="border-t border-border/60 px-5 py-3">
            <Button variant="ghost" size="sm" className="w-full rounded-full text-xs" onClick={() => setStep("cart")}>
              ← Back to Cart
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
