"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";

import { getOrderAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      getOrderAction(orderId).then((data) => {
        setOrder(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold">Order Placed Successfully!</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Thank you for your order. We&apos;ll start processing it right away. You can
        track its status from your orders page.
      </p>

      {order && (
        <div className="mt-6 w-full max-w-md rounded-2xl border border-border/70 bg-card/90 p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Order Details</h2>
            <Badge variant="outline" className="rounded-full text-xs">
              {order.status}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">{order.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <Badge
                className={`rounded-full text-xs ${
                  order.paymentStatus === "COMPLETED"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {order.paymentStatus === "COMPLETED" ? "Paid" : "Pending (COD)"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{order.orderItems.length}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {order.orderItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{item.product.name}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/dashboard/orders">
            View Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
