"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { getOrderAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

type Order = Awaited<ReturnType<typeof getOrderAction>>;

type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

const statusColors: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  CONFIRMED:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  SHIPPED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  DELIVERED:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getOrderAction(id).then((o) => {
        setOrder(o);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-16 animate-pulse rounded-2xl border border-border/60 bg-muted/30"
          />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/orders">
            <ArrowLeft className="mr-1 size-4" /> Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const address = order.shippingAddress as ShippingAddress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
        <Link href="/orders">
          <ArrowLeft className="mr-1 size-4" /> Orders
        </Link>
      </Button>

      {/* Header */}
      <div className="luxury-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Order
            </p>
            <p className="text-lg font-semibold">
              #{order.id.slice(-10).toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] ?? "bg-muted text-muted-foreground"}`}
            >
              {order.status}
            </span>
            <p className="text-xs text-muted-foreground">
              Payment:{" "}
              <span className="font-medium text-foreground">
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="luxury-panel p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Items
        </h2>
        {order.orderItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
          >
            <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
              {item.product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                  IMG
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.product.name}</p>
              <p className="text-xs text-muted-foreground">
                SKU: {item.product.sku}
              </p>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-sm">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <p className="font-medium">Total</p>
          <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
        </div>
      </div>

      {/* Shipping address */}
      <div className="luxury-panel p-6 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Shipping Address
        </h2>
        <div className="text-sm space-y-1 text-foreground">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} — {address.postalCode}
          </p>
          <p>{address.country}</p>
        </div>
      </div>
    </motion.div>
  );
}
