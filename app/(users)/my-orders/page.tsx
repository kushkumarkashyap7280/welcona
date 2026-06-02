"use client";

import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  XCircle, 
  ArrowRight, 
  Loader2, 
  MessageCircle, 
  HelpCircle,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText
} from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    sku: string;
    images: { id: string; image: string; isPrimary: boolean }[];
  };
};

type Order = {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  deliveryOption: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: OrderItem[];
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const storedStr = localStorage.getItem("welcona_orders");
        if (!storedStr) {
          setLoading(false);
          return;
        }

        const storedArray = JSON.parse(storedStr);
        if (!Array.isArray(storedArray) || storedArray.length === 0) {
          setLoading(false);
          return;
        }

        const ids = storedArray.map((o: any) => o.orderId || o.id).filter(Boolean);
        if (ids.length === 0) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/orders?ids=${ids.join(",")}`);
        if (!response.ok) {
          throw new Error("Failed to retrieve order details");
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        console.error("Error loading client tracking orders:", err);
        setError("Unable to retrieve your order tracking information.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500" />;
      case "CONFIRMED":
        return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
      case "SHIPPED":
        return <Truck className="h-3.5 w-3.5 text-indigo-500" />;
      case "DELIVERED":
        return <PackageCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case "CANCELLED":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabelColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60";
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60";
      case "CANCELLED":
        return "bg-red-100 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getWhatsAppLink = (order: Order) => {
    const phone = "919625711655";
    let text = "";
    if (order.status === "CANCELLED") {
      text = `Hello Welcona, I have a query regarding my cancelled order #${order.id.slice(0, 8).toUpperCase()}. Could you please review it?`;
    } else if (order.paymentMethod === "WHATSAPP" && order.status === "PENDING") {
      text = `Hello Welcona, I placed a Wholesale order #${order.id.slice(0, 8).toUpperCase()} for a total of ${formatPrice(order.total)}. I would like to coordinate offline payment and confirm order details.`;
    } else {
      text = `Hello Welcona, I want to inquire about my order #${order.id.slice(0, 8).toUpperCase()}. Dynamic tracking status is currently: ${order.status}.`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Retrieving secure order ledger...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-bold text-foreground">Failed to load orders</h3>
        <p className="text-xs text-muted-foreground mt-1.5">{error}</p>
        <Button className="mt-4 font-semibold text-xs" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center select-none">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">No orders placed yet</h2>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          You haven&apos;t placed any orders on this browser yet. Browse our premium faucets, designer showers, and elegant CP fittings!
        </p>
        <Button asChild className="mt-6 font-semibold text-xs">
          <Link href="/products">
            Browse Products <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 select-none">
      <div className="space-y-1.5 mb-6">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 md:text-2xl">
          <ClipboardList className="h-6 w-6 text-primary shrink-0" />
          My Orders Tracker
        </h1>
        <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
          Secure, direct tracking for guest orders. Click on any row to view expanded item details and shipping logs.
        </p>
      </div>

      <Card className="border-border/60 overflow-hidden shadow-sm">
        <CardHeader className="py-4 px-4 bg-muted/20 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Order Index</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 w-full overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/10">
              <TableRow className="border-b border-border/50 text-[11px]">
                <TableHead className="w-[18%] sm:w-[15%] font-bold px-2 sm:px-4">ID</TableHead>
                <TableHead className="font-bold hidden sm:table-cell sm:w-[15%]">Date</TableHead>
                <TableHead className="w-[28%] sm:w-[25%] font-bold px-1 sm:px-4">Products</TableHead>
                <TableHead className="w-[22%] sm:w-[15%] font-bold px-1 sm:px-4">Total</TableHead>
                <TableHead className="font-bold hidden sm:table-cell sm:w-[15%]">Delivery</TableHead>
                <TableHead className="w-[18%] sm:w-[12%] font-bold px-1 sm:px-4">Status</TableHead>
                <TableHead className="w-[14%] sm:w-[5%] font-bold px-1 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const totalItemsCount = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <Fragment key={order.id}>
                    {/* Concise Summary Row */}
                    <TableRow 
                      key={order.id} 
                      onClick={() => toggleExpand(order.id)}
                      className={`cursor-pointer border-b border-border/40 hover:bg-muted/40 transition-colors ${
                        order.paymentMethod === "WHATSAPP" && order.status === "PENDING"
                          ? "bg-amber-500/2"
                          : ""
                      }`}
                    >
                      <TableCell className="font-mono text-[10px] sm:text-[11px] font-bold px-2 sm:px-4 py-3 truncate">
                        <div className="flex flex-col gap-0.5 items-start">
                          <span>#{order.id.slice(0, 5).toUpperCase()}</span>
                          {order.paymentMethod === "WHATSAPP" && (
                            <span className="rounded px-1 py-0.2 text-[7px] sm:text-[8px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                              Wholesale
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground hidden sm:table-cell py-3">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </TableCell>
                      <TableCell className="px-1 sm:px-4 py-3 truncate">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="hidden sm:flex -space-x-2 shrink-0">
                            {order.orderItems.slice(0, 3).map((item) => {
                              const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
                              return (
                                <div key={item.id} className="h-6 w-6 rounded border border-background overflow-hidden bg-muted shadow-sm">
                                  {img ? (
                                    <ProductImage
                                      src={img.image}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      fallbackSize="sm"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ShoppingBag className="h-2 w-2 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">
                            {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-[11px] font-bold text-foreground px-1 sm:px-4 py-3 truncate">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-[11px] font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell py-3">
                        {order.deliveryOption === "CUSTOMER_PICKUP" ? "Warehouse Pickup" : "Home Delivery"}
                      </TableCell>
                      <TableCell className="px-1 sm:px-4 py-3">
                        <Badge className={`rounded-full border text-[9px] font-bold px-1.5 py-0.5 shadow-none flex items-center justify-center gap-1 w-fit ${getStatusLabelColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="hidden sm:inline">{order.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-1 py-3">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground rounded-full hover:bg-muted shrink-0 mx-auto">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Detailed Expanded Row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/10 border-b border-border/40 hover:bg-muted/10">
                        <TableCell colSpan={7} className="px-2 sm:px-4 py-3">
                          <div className="w-full max-w-[calc(100vw-36px)] sm:max-w-none overflow-hidden space-y-4 animate-in fade-in duration-300">
                            {/* Products detailed grid */}
                            <div className="space-y-2 border border-border/50 rounded-lg p-2.5 bg-card w-full overflow-hidden">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 items-center gap-1">
                                <FileText className="h-3.5 w-3.5" /> Ordered Products Details
                              </span>
                              {order.orderItems.map((item) => {
                                const img = item.product.images.find((i) => i.isPrimary) ?? item.product.images[0];
                                return (
                                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 text-xs w-full min-w-0 overflow-hidden">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="h-8 w-8 rounded border overflow-hidden shrink-0">
                                        {img && (
                                          <ProductImage src={img.image} alt="" className="h-full w-full object-cover" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-bold text-foreground truncate text-[11px] sm:text-xs">{item.product.name}</p>
                                        <p className="text-[9px] text-muted-foreground truncate">SKU: {item.product.sku} &middot; Qty: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <span className="font-bold text-foreground text-xs shrink-0 pl-2">
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Shipping Log Coordinates */}
                            <div className="flex flex-col sm:flex-row gap-4 border border-border/50 rounded-lg p-3 bg-card text-xs w-full overflow-hidden">
                              <div className="flex-1 space-y-1 min-w-0">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" /> Shipping &amp; Logistics
                                </span>
                                <p className="font-semibold text-foreground mt-0.5 wrap-break-word whitespace-normal leading-normal">
                                  {order.deliveryOption === "CUSTOMER_PICKUP" 
                                    ? "📍 Warehouse Pickup (Coordinated)" 
                                    : `🚚 Home Delivery Address: ${order.shippingAddress}`}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  Customer Name: {order.customerName} &middot; Phone: {order.customerPhone}
                                </p>
                              </div>
                              <div className="flex items-end shrink-0 pt-2 sm:pt-0">
                                <Button 
                                  asChild 
                                  className={`w-full sm:w-auto font-bold text-xs h-9 px-4 gap-1.5 shadow-none rounded-lg ${
                                    order.status === "CANCELLED"
                                      ? "bg-red-600 hover:bg-red-700 text-white"
                                      : order.paymentMethod === "WHATSAPP" && order.status === "PENDING"
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : "bg-[#25D366] hover:bg-[#20ba56] text-white"
                                  }`}
                                >
                                  <a href={getWhatsAppLink(order)} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-4 w-4" />
                                    {order.status === "CANCELLED"
                                      ? "Inquire Cancellation"
                                      : order.paymentMethod === "WHATSAPP" && order.status === "PENDING"
                                      ? "Coordinate Wholesale Pay"
                                      : "Inquire on WhatsApp"}
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
