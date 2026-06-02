"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Truck,
  User,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    sku: string;
    images: { id: string; image: string; isPrimary: boolean; index: number }[];
  };
};

type Order = {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  deliveryOption: string;
  deliveryCharge: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: OrderItem[];
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING": return "bg-amber-500 text-white";
    case "CONFIRMED": return "bg-blue-500 text-white";
    case "SHIPPED": return "bg-indigo-500 text-white";
    case "DELIVERED": return "bg-emerald-600 text-white";
    case "CANCELLED": return "bg-red-500 text-white";
    default: return "bg-muted-foreground text-white";
  }
}

function StatusTimeline({ status }: { status: string }) {
  const cancelled = status === "CANCELLED";
  const currentIndex = STATUS_STEPS.indexOf(status as any);

  if (cancelled) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
          <Package className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-red-500">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, i) => {
        const done = currentIndex >= i;
        const active = currentIndex === i;
        const isLast = i === STATUS_STEPS.length - 1;

        const icons: Record<string, React.ReactNode> = {
          PENDING: <Clock className="h-4 w-4" />,
          CONFIRMED: <CheckCircle2 className="h-4 w-4" />,
          SHIPPED: <Truck className="h-4 w-4" />,
          DELIVERED: <PackageCheck className="h-4 w-4" />,
        };

        const labels: Record<string, string> = {
          PENDING: "Pending",
          CONFIRMED: "Confirmed",
          SHIPPED: "Shipped",
          DELIVERED: "Delivered",
        };

        return (
          <div key={step} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
                } ${active ? "ring-2 ring-primary ring-offset-2" : ""}`}
              >
                {icons[step]}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  done ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {labels[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-10 sm:w-16 md:w-20 mb-4 mx-1 transition-colors ${
                  currentIndex > i ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

async function updateOrderStatus(data: {
  orderId: string;
  status?: string;
}) {
  const res = await fetch("/api/admin/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update order");
  return res.json();
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setOrder(data.order);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const mutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      toast.success("Order updated");
      fetchOrder();
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading order...</span>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-xl font-semibold">Order not found</p>
        <Button asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-muted-foreground font-mono">
            #{order.id.slice(0, 8).toUpperCase()} &middot;{" "}
            {format(new Date(order.createdAt), "d MMM yyyy, h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`rounded-full text-[11px] ${getStatusColor(order.status)}`}>
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Wholesale bulk order warning callout */}
      {order.paymentMethod === "WHATSAPP" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">
                🏆 Wholesale/Bulk Order (WhatsApp Flow)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal">
                This is a guest bulk order exceeding the threshold. Stock has <strong>not</strong> been decremented yet and payment is pending. 
                Verify offline payment details first. When ready, confirm the order using the atomic stock-allocation button below.
              </p>
            </div>
          </div>
          {order.status === "PENDING" && (
            <div className="flex justify-end pt-1">
              <Button
                disabled={mutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 border border-amber-500 font-semibold"
                onClick={() => mutation.mutate({ orderId: order.id, status: "CONFIRMED" })}
              >
                {mutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Allocating & Confirming...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" />Confirm Wholesale Order & Allocate Stock</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Status timeline */}
      <div className="rounded-xl border border-border/70 bg-card/90 p-6">
        <h2 className="text-base font-semibold mb-5">Order Status</h2>
        <StatusTimeline status={order.status} />
      </div>

      {/* Status controls */}
      <div className="rounded-xl border border-border/70 bg-card/90 p-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Update Order Status</span>
          <Select
            value={order.status}
            onValueChange={(v) =>
              mutation.mutate({ orderId: order.id, status: v })
            }
            disabled={mutation.isPending}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        {mutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Order Items */}
        <div className="rounded-xl border border-border/70 bg-card/90 p-6 space-y-4">
          <h2 className="text-base font-semibold">
            Items ({order.orderItems.length})
          </h2>
          <div className="space-y-4">
            {order.orderItems.map((item) => {
              const img =
                item.product.images.find((i) => i.isPrimary) ??
                item.product.images[0];
              return (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
                    {img ? (
                      <ProductImage
                        src={img.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        fallbackSize="sm"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.product.sku}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} &times; {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border/60 pt-4 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-xl border border-border/70 bg-card/90 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <User className="h-4 w-4" /> Customer
            </h2>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {order.customerName && (
                <p className="font-semibold text-foreground">
                  {order.customerName}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-border/70 bg-card/90 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <MapPin className="h-4 w-4" /> Shipping Address
            </h2>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {order.shippingAddress}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="rounded-xl border border-border/70 bg-card/90 p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Truck className="h-4 w-4" /> Delivery
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Option</span>
                <span className="font-semibold">
                  {order.deliveryOption === "CUSTOMER_PICKUP" ? "Customer Pickup" : "Home Delivery"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charge</span>
                <span className="font-medium">
                  {order.deliveryOption === "CUSTOMER_PICKUP" ? "Warehouse Pickup" : "Arranged Separately"}
                </span>
              </div>
              {order.deliveryOption === "CUSTOMER_PICKUP" ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Customer will arrange pickup from our warehouse (Mon–Sat, 9 AM – 7 PM).
                </p>
              ) : (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  ℹ️ Arrange Porter/courier. Customer pays the courier boy directly.
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border/70 bg-card/90 p-5">
            <h2 className="text-base font-semibold mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold text-xs">
                  {order.paymentMethod === "WHATSAPP" ? "🏆 WhatsApp Wholesale" : "Razorpay Online"}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Rzp Order</span>
                  <span className="font-mono text-[11px] truncate text-right">
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Rzp Payment</span>
                  <span className="font-mono text-[11px] truncate text-right">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
