"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Trash2, ShoppingBag, CreditCard,
  CheckCircle, Mail, Phone, MapPin, User,
  Minus, Plus, X, Store, Truck,
  FileText, ExternalLink, AlertTriangle, MessageCircle, Trophy,
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

type DeliveryOption = "CUSTOMER_PICKUP" | "HOME_DELIVERY";

const WHATSAPP_NUMBER = "919625711655";
const BULK_THRESHOLD = parseInt(process.env.NEXT_PUBLIC_BULK_THRESHOLD || "10000");

const DELIVERY_OPTIONS: { value: DeliveryOption; label: string; desc: string; icon: typeof Store; contactRequired?: boolean }[] = [
  { value: "CUSTOMER_PICKUP", label: "Customer Pickup", desc: "Pick up from our shop within 7 working days. Any transport/loading hire costs paid by you directly to the agent as per Quantity, Weight, Size & Distance.", icon: Store },
  { value: "HOME_DELIVERY", label: "Home Delivery", desc: "Coordinated via third-party courier (e.g. Porter). You pay the courier agent/driver directly as per Quantity, Weight, Size & Distance.", icon: Truck, contactRequired: true },
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
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

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
  const grandTotal = subtotal; // Delivery charge is not handled in our system (customer pays directly)
  const isBulkOrder = subtotal >= BULK_THRESHOLD;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const saveOrderToLocalStorage = (order: any, isBulk: boolean) => {
    try {
      // 1. Save to array
      const existingOrders = JSON.parse(localStorage.getItem("welcona_orders") || "[]");
      const orderEntry = {
        orderId: order.id,
        total: order.total,
        createdAt: new Date().toISOString(),
        isBulk,
        deliveryOption,
      };
      
      // Prevent duplicates
      if (!existingOrders.some((o: any) => o.orderId === order.id)) {
        existingOrders.unshift(orderEntry);
        localStorage.setItem("welcona_orders", JSON.stringify(existingOrders));
      }

      // 2. Save last order for quick confirmation screen details
      localStorage.setItem("welcona_last_order", JSON.stringify({
        ...orderEntry,
        customerName: name,
      }));
    } catch (err) {
      console.error("Error saving order to localStorage:", err);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill out all shipping details."); return;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions."); return;
    }
    if (!deliveryConfirmed) {
      toast.error("Please confirm you have discussed delivery arrangements on WhatsApp."); return;
    }

    setSubmitting(true);
    try {
      // Re-validate stock one final time before payment/order creation
      const stockCheck = await validateStock(cart);
      if (!stockCheck.valid) {
        const issueNames = stockCheck.issues.map(si =>
          si.available === 0 ? `"${si.name}" (out of stock)` : `"${si.name}" (only ${si.available} available)`
        ).join(", ");
        toast.error(`Stock issue: ${issueNames}. Cart has been updated.`);
        setSubmitting(false);
        return;
      }

      // ─── BULK ORDER FLOW (Skip Razorpay entirely) ───
      if (isBulkOrder) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            shippingAddress: address,
            deliveryOption,
            isBulk: true,
            cartItems: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to submit bulk order.");

        // Save order ID to localStorage for guests
        saveOrderToLocalStorage(data.order, true);

        // Clear cart
        localStorage.removeItem("welcona_cart");
        window.dispatchEvent(new Event("cart-updated"));
        setConfirmedOrder({ ...data.order, isBulk: true });
        setStep("confirmed");
        toast.success("🏆 Bulk order placed successfully!");
        setSubmitting(false);
        return;
      }

      // ─── REGULAR ORDER FLOW (Razorpay) ───
      if (!(window as any).Razorpay) {
        toast.error("Razorpay SDK is loading. Please try again in a moment.");
        setSubmitting(false); return;
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

            // Save order ID to localStorage for guests
            saveOrderToLocalStorage(completeData.order, false);

            localStorage.removeItem("welcona_cart");
            window.dispatchEvent(new Event("cart-updated"));
            setConfirmedOrder({ ...completeData.order, isBulk: false });
            setStep("confirmed");
            toast.success("Payment verified and order created!");
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#b8960c" },
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
      setSubmitting(false);
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
            <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in duration-300">
              {confirmedOrder.isBulk ? (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 border border-amber-300 animate-bounce">
                  <Trophy className="h-10 w-10 text-amber-600" />
                </div>
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                  <CheckCircle className="h-10 w-10" />
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {confirmedOrder.isBulk ? "🏆 Bulk Order Received!" : "Order Submitted Successfully!"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {confirmedOrder.isBulk 
                    ? "Your wholesale items are reserved. Next step is manual payment verification via WhatsApp."
                    : "Your order details have been saved."}
                </p>
              </div>

              <div className="rounded-xl bg-muted/60 p-5 text-left space-y-3 text-xs border border-border/40">
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Order ID</span>
                  <span className="font-mono font-bold text-sm bg-background px-2.5 py-1 rounded-md border text-primary">
                    #{confirmedOrder.id?.split("-")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer Name</span><span className="font-semibold text-foreground">{confirmedOrder.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Order Total</span><span className="font-bold text-amber-700 dark:text-amber-500">{formatPrice(confirmedOrder.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-semibold">{confirmedOrder.isBulk ? "WhatsApp (Pending)" : "Paid Online"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-emerald-600">{confirmedOrder.deliveryOption === "CUSTOMER_PICKUP" ? "Customer Pickup" : "Home Delivery (Arranged separately)"}</span></div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  {confirmedOrder.isBulk 
                    ? "👉 Action Required: Pay & Confirm on WhatsApp" 
                    : "👉 Action Required: Contact us to coordinate delivery"}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-500 leading-normal">
                  {confirmedOrder.isBulk
                    ? "Please click below to connect with our support team to verify your invoice and receive offline payment details."
                    : "Please send us a message to specify whether you will pick up the items or if we should book a Porter/courier."}
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    confirmedOrder.isBulk
                      ? `Hi, my order no is #${confirmedOrder.id?.split("-")[0].toUpperCase()}. I placed a bulk order on Welcona. Please help me complete the payment.`
                      : `Hi, my order no is #${confirmedOrder.id?.split("-")[0].toUpperCase()}. I want to discuss the delivery setup for my order.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20ba56] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <MessageCircle className="h-4.5 w-4.5 fill-current" />
                  {confirmedOrder.isBulk ? "Pay & Confirm on WhatsApp" : "Coordinate Delivery on WhatsApp"}
                </a>
              </div>

              <div className="text-[11px] text-muted-foreground text-center bg-muted/30 py-2 rounded-lg px-2">
                ℹ️ We save this info in your browser only, so do not delete site data.
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button className="w-full rounded-full font-semibold" onClick={() => { onClose(); router.push("/products"); }}>Continue Shopping</Button>
                <Button variant="outline" className="w-full rounded-full font-medium" onClick={onClose}>Close Drawer</Button>
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
                  const isSelected = deliveryOption === opt.value;
                  return (
                    <div key={opt.value} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryOption(opt.value)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-transparent hover:bg-muted/50"
                        }`}
                      >
                        <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{opt.label}</span>
                            <span className="text-xs font-bold text-primary">
                              As per Quantity, Weight, Size &amp; Distance
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>

                      {isSelected && opt.contactRequired && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 text-xs space-y-1.5 ml-8 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Contact us on WhatsApp first
                          </p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-normal">
                            Since we arrange courier directly and you pay them, please coordinate with us before checkout.
                          </p>
                          <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Welcona team, I want to discuss delivery for my order items.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-400 underline underline-offset-2 hover:text-primary transition-colors"
                          >
                            💬 Coordinate arrangements on WhatsApp ↗
                          </a>
                        </div>
                      )}
                    </div>
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
                  <Input id="cart-phone" type="tel" required placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <div className="relative">
                  <MapPin className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="cart-address" required placeholder="Full Shipping Address" value={address} onChange={e => setAddress(e.target.value)} className="pl-9 min-h-20 rounded-xl" />
                </div>
              </div>

              {/* Two Checkboxes */}
              <div className="space-y-2.5 pt-1">
                {/* 1. T&C */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms-agree"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <label htmlFor="terms-agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2 font-medium inline-flex items-center gap-0.5">
                      Terms & Conditions <ExternalLink className="h-3 w-3" />
                    </Link>
                  </label>
                </div>

                {/* 2. WhatsApp Delivery Confirmed */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="delivery-agree"
                    checked={deliveryConfirmed}
                    onChange={e => setDeliveryConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <label htmlFor="delivery-agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                    I confirm that I have discussed and agreed to the <span className="font-semibold text-foreground">delivery arrangements</span> via WhatsApp.
                  </label>
                </div>
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({cart.length})</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-semibold text-[10px] text-right leading-tight max-w-[180px]">
                    As per Quantity, Weight, Size &amp; Distance (Payable directly to agent/driver)
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Gold badge if bulk order */}
              {isBulkOrder && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-xl p-4 text-xs space-y-2 text-left animate-in fade-in duration-300">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-400">
                    <Trophy className="h-4 w-4 animate-bounce" />
                    Wholesale Order Qualified!
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-500 leading-normal">
                    This order qualifies for our priority Wholesale desk (totals ₹10,000+). We bypass Razorpay and process payment directly over WhatsApp.
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                disabled={submitting || !agreedToTerms || !deliveryConfirmed} 
                className={`w-full rounded-full text-sm font-semibold transition-all ${
                  isBulkOrder 
                    ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 border border-amber-500" 
                    : ""
                }`}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : isBulkOrder ? (
                  <><Trophy className="mr-2 h-4 w-4" />Complete Bulk Order via WhatsApp</>
                ) : (
                  <><CreditCard className="mr-2 h-4 w-4" />Pay {formatPrice(grandTotal)} Online</>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer (cart step only) */}
        {step === "cart" && !loading && cart.length > 0 && (
          <div className="border-t border-border/60 px-5 py-4 space-y-3">
            {isBulkOrder && (
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-2 text-[10px] text-amber-800 dark:text-amber-400 font-medium text-center">
                🏆 Congratulations! You qualify for Wholesale checkout benefits.
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({cart.length} items)</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>
            <Button
              className={`w-full rounded-full font-semibold ${
                isBulkOrder ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              }`}
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
