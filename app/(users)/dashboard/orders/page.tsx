"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  Package,
  Clock,
  History,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

import { getOrdersAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: { id: string; image: string; isPrimary: boolean; index: number }[];
  };
};

type Order = {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date | string;
  orderItems: OrderItem[];
};

type Tab = "active" | "history";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED"];
const HISTORY_STATUSES = ["DELIVERED", "CANCELLED"];

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500 text-white";
    case "CONFIRMED":
      return "bg-blue-500 text-white";
    case "SHIPPED":
      return "bg-indigo-500 text-white";
    case "DELIVERED":
      return "bg-emerald-600 text-white";
    case "CANCELLED":
      return "bg-red-500 text-white";
    default:
      return "bg-muted-foreground text-white";
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-600 text-white";
    case "PENDING":
      return "bg-amber-500 text-white";
    case "FAILED":
      return "bg-red-500 text-white";
    case "REFUNDED":
      return "bg-purple-500 text-white";
    default:
      return "bg-muted-foreground text-white";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    getOrdersAction().then((data) => {
      setOrders(data as Order[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading orders...</span>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter(
    (o) => HISTORY_STATUSES.includes(o.status) || ["FAILED", "REFUNDED"].includes(o.paymentStatus)
  );

  const displayedOrders = tab === "active" ? activeOrders : historyOrders;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track and manage your orders
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <Button
          variant={tab === "active" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setTab("active")}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Under Process
          {activeOrders.length > 0 && (
            <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
              {activeOrders.length}
            </span>
          )}
        </Button>
        <Button
          variant={tab === "history" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setTab("history")}
        >
          <History className="mr-1.5 h-3.5 w-3.5" />
          History
          {historyOrders.length > 0 && (
            <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
              {historyOrders.length}
            </span>
          )}
        </Button>
      </div>

      {/* Orders List */}
      <div className="mt-4 space-y-4">
        {displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/90 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {tab === "active" ? (
                <Package className="h-7 w-7 text-muted-foreground" />
              ) : (
                <History className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <p className="mt-4 font-medium">
              {tab === "active"
                ? "No active orders"
                : "No order history yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "active"
                ? "Orders being processed will appear here"
                : "Completed, cancelled, and refunded orders will appear here"}
            </p>
            {tab === "active" && (
              <Button asChild className="mt-4" size="sm">
                <Link href="/products">Browse Products</Link>
              </Button>
            )}
          </div>
        ) : (
          displayedOrders.map((order) => {
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block rounded-2xl border border-border/70 bg-card/90 p-5 transition hover:shadow-sm hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ordered{" "}
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                      #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={`rounded-full text-[11px] ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </Badge>
                    <Badge
                      className={`rounded-full text-[11px] ${getPaymentStatusColor(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus === "COMPLETED"
                        ? "Paid"
                        : order.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {order.orderItems.slice(0, 3).map((item) => {
                      const img =
                        item.product.images.find((i) => i.isPrimary) ??
                        item.product.images[0];
                      return img ? (
                        <div
                          key={item.id}
                          className="h-10 w-10 overflow-hidden rounded-lg border-2 border-card"
                        >
                          <ProductImage
                            src={img.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            fallbackSize="sm"
                          />
                        </div>
                      ) : (
                        <div
                          key={item.id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-card bg-muted"
                        >
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                    {order.orderItems.length > 3 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-card bg-muted text-xs font-medium">
                        +{order.orderItems.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.orderItems.map((i) => i.product.name).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderItems.length}{" "}
                      {order.orderItems.length === 1 ? "item" : "items"} &middot;{" "}
                      {order.paymentMethod.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
