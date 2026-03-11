"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { getOrdersAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

type Orders = Awaited<ReturnType<typeof getOrdersAction>>;

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

const paymentColors: Record<string, string> = {
  PENDING: "text-yellow-600 dark:text-yellow-400",
  COMPLETED: "text-green-600 dark:text-green-400",
  FAILED: "text-red-600 dark:text-red-400",
  REFUNDED: "text-purple-600 dark:text-purple-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Orders>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersAction().then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-2xl border border-border/60 bg-muted/30"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-panel flex flex-col items-center gap-4 py-20 text-center"
        >
          <Package className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild className="rounded-full">
            <Link href="/products">Browse Products</Link>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
            >
              <Link
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-border/60 bg-card/70 p-4 transition hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      #{order.id.slice(-10).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {order.orderItems.length} item
                      {order.orderItems.length !== 1 ? "s" : ""}
                    </p>
                    <p
                      className={`text-xs font-medium ${paymentColors[order.paymentStatus] ?? ""}`}
                    >
                      Payment: {order.paymentStatus}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Item thumbnails */}
                <div className="mt-3 flex gap-2">
                  {order.orderItems.slice(0, 4).map((oi) => (
                    <div
                      key={oi.id}
                      className="size-10 overflow-hidden rounded-lg border border-border/60 bg-muted"
                    >
                      {oi.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={oi.product.images[0]}
                          alt={oi.product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[8px] text-muted-foreground">
                          IMG
                        </div>
                      )}
                    </div>
                  ))}
                  {order.orderItems.length > 4 && (
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border/60 bg-muted text-xs text-muted-foreground">
                      +{order.orderItems.length - 4}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
