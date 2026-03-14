"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  CreditCard,
  Banknote,
  Plus,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  getCartAction,
  getAddressesAction,
  createAddressAction,
  placeOrderAction,
  type AddressInput,
} from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleMinQuantity: number;
    discount: number | null;
    images: { id: string; image: string; isPrimary: boolean; index: number }[];
    sku: string;
    quantity: number;
  };
};

type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const PAYMENT_METHODS = [
  { id: "CREDIT_CARD", label: "Credit Card", icon: CreditCard, online: true },
  { id: "DEBIT_CARD", label: "Debit Card", icon: CreditCard, online: true },
  { id: "UPI", label: "UPI", icon: CreditCard, online: true },
  { id: "NETBANKING", label: "Net Banking", icon: CreditCard, online: true },
  { id: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: Banknote, online: false },
] as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getUnitPrice(item: CartItem) {
  const product = item.product;
  let unitPrice = product.retailPrice;
  if (item.quantity >= product.wholesaleMinQuantity) {
    unitPrice = product.wholesalePrice;
  }
  if (product.discount) {
    unitPrice = unitPrice * (1 - product.discount / 100);
  }
  return unitPrice;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Address form
  const [addressForm, setAddressForm] = useState<AddressInput>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  useEffect(() => {
    async function load() {
      const [cartData, addressData] = await Promise.all([
        getCartAction(),
        getAddressesAction(),
      ]);

      const items = (cartData as any)?.cartItems ?? [];
      setCartItems(items);
      setAddresses(addressData as Address[]);

      if (addressData.length > 0) {
        setSelectedAddress(addressData[0].id);
      }

      if (items.length === 0) {
        router.push("/dashboard/cart");
      }

      setLoading(false);
    }
    load();
  }, [router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getUnitPrice(item) * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCreateAddress = async () => {
    if (!addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      toast.error("Please fill in all required address fields");
      return;
    }

    const result = await createAddressAction(addressForm);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Address added");
    const refreshed = await getAddressesAction();
    setAddresses(refreshed as Address[]);
    if (result.address) {
      setSelectedAddress(result.address.id);
    }
    setShowAddressForm(false);
    setAddressForm({ line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }

    setPlacing(true);

    const paymentConfig = PAYMENT_METHODS.find((m) => m.id === selectedPayment);
    const isOnline = paymentConfig?.online ?? false;

    if (isOnline) {
      // Create Razorpay order
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          const err = await response.json();
          toast.error(err.error || "Failed to create payment order");
          setPlacing(false);
          return;
        }

        const data = await response.json();

        // Open Razorpay checkout
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Welcona",
          description: `Order for ${totalItems} items`,
          order_id: data.orderId,
          handler: async (response: any) => {
            // Verify payment
            const verifyRes = await fetch("/api/checkout", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              toast.error("Payment verification failed");
              setPlacing(false);
              return;
            }

            const verified = await verifyRes.json();

            // Place the order
            const result = await placeOrderAction({
              addressId: selectedAddress,
              paymentMethod: selectedPayment,
              razorpayOrderId: verified.razorpayOrderId,
              razorpayPaymentId: verified.razorpayPaymentId,
            });

            if (result.error) {
              toast.error(result.error);
              setPlacing(false);
              return;
            }

            router.push(`/dashboard/orders/success?orderId=${result.orderId}`);
          },
          modal: {
            ondismiss: () => {
              setPlacing(false);
            },
          },
          theme: { color: "#000000" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch {
        toast.error("Payment initialization failed");
        setPlacing(false);
      }
    } else {
      // Cash on Delivery — place order directly
      const result = await placeOrderAction({
        addressId: selectedAddress,
        paymentMethod: selectedPayment,
      });

      if (result.error) {
        toast.error(result.error);
        setPlacing(false);
        return;
      }

      router.push(`/dashboard/orders/success?orderId=${result.orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading checkout...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/cart")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <p className="text-sm text-muted-foreground">{totalItems} items</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div className="rounded-2xl border border-border/70 bg-card/90 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddressForm(!showAddressForm)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add New
              </Button>
            </div>

            {/* Address Form */}
            {showAddressForm && (
              <div className="mb-4 space-y-3 rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="line1">Address Line 1 *</Label>
                    <Input
                      id="line1"
                      value={addressForm.line1}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, line1: e.target.value })
                      }
                      placeholder="House/Flat number, Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="line2">Address Line 2</Label>
                    <Input
                      id="line2"
                      value={addressForm.line2}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, line2: e.target.value })
                      }
                      placeholder="Landmark, Area"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">PIN Code *</Label>
                    <Input
                      id="postalCode"
                      value={addressForm.postalCode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateAddress}>
                    Save Address
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Address List */}
            {addresses.length === 0 && !showAddressForm ? (
              <p className="text-sm text-muted-foreground">
                No addresses saved. Add a delivery address to continue.
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedAddress === addr.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/70 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-sm">
                        <p className="font-medium">{addr.line1}</p>
                        {addr.line2 && (
                          <p className="text-muted-foreground">{addr.line2}</p>
                        )}
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} — {addr.postalCode}
                        </p>
                        <p className="text-muted-foreground">{addr.country}</p>
                      </div>
                      {selectedAddress === addr.id && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-2xl border border-border/70 bg-card/90 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h2>

            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    selectedPayment === method.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:border-primary/50"
                  }`}
                >
                  <method.icon className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {method.online ? "Pay online via Razorpay" : "Pay when delivered"}
                    </p>
                  </div>
                  {selectedPayment === method.id && (
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column — Summary */}
        <div className="h-fit space-y-4 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-sm lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Order Summary</h2>

          <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
              const unitPrice = getUnitPrice(item);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  {img && (
                    <ProductImage
                      src={img.image}
                      alt={item.product.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      fallbackSize="sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} &times; {formatPrice(unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatPrice(unitPrice * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-emerald-600">Free</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={placing || !selectedAddress || !selectedPayment}
            onClick={handlePlaceOrder}
          >
            {placing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            {selectedPayment === "CASH_ON_DELIVERY"
              ? "Place Order (COD)"
              : "Pay & Place Order"}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Your payment is secured with Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
