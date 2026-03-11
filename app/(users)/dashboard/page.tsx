"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Package, ArrowRight, BadgeCheck } from "lucide-react";
import { getProfileAction } from "@/lib/actions/user";
import { getCartAction } from "@/lib/actions/user";
import { getOrdersAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

type Profile = Awaited<ReturnType<typeof getProfileAction>>;
type Cart = Awaited<ReturnType<typeof getCartAction>>;
type Orders = Awaited<ReturnType<typeof getOrdersAction>>;

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [cart, setCart] = useState<Cart>(null);
  const [orders, setOrders] = useState<Orders>([]);

  useEffect(() => {
    getProfileAction().then(setProfile);
    getCartAction().then(setCart);
    getOrdersAction().then(setOrders);
  }, []);

  const cartCount =
    cart?.cartItems.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const stats = [
    {
      label: "Total orders",
      value: orders.length,
      icon: Package,
      href: "/orders",
    },
    {
      label: "Items in cart",
      value: cartCount,
      icon: ShoppingCart,
      href: "/cart",
    },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl font-semibold md:text-3xl">
          {profile?.fullName ? `Hello, ${profile.fullName}` : "Hello 👋"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {profile?.email}
          {profile?.verified && (
            <span className="ml-2 inline-flex items-center gap-1 text-primary text-xs">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          )}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(({ label, value, icon: Icon, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link
              href={href}
              className="luxury-card group flex items-center justify-between transition hover:border-primary/40"
            >
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold">{value}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                <Icon className="size-5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent orders preview */}
      {orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="luxury-panel p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Recent Orders</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-full text-xs">
              <Link href="/orders">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm transition hover:border-primary/30 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                    {" · "}{order.orderItems.length} item
                    {order.orderItems.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.total.toFixed(2)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3"
      >
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/details">Edit Profile</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/cart">View Cart</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/products">Browse Products</Link>
        </Button>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
