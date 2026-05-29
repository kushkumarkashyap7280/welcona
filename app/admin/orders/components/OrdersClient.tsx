"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductImage } from "@/components/ui/product-image";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: { id: string; image: string; isPrimary: boolean }[];
  };
};

type Order = {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryOption: string;
  deliveryCharge: number;
  shippingAddress: any;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  orderItems: OrderItem[];
};

interface AdminOrdersResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  orders: Order[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

async function fetchOrders(params: {
  page: number;
  status: string;
  paymentStatus: string;
  query: string;
}): Promise<AdminOrdersResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: "15",
  });

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.paymentStatus && params.paymentStatus !== "all") {
    searchParams.set("paymentStatus", params.paymentStatus);
  }
  if (params.query) {
    searchParams.set("q", params.query);
  }

  const res = await fetch(`/api/admin/orders?${searchParams.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function updateOrderStatus(data: {
  orderId: string;
  status?: string;
  paymentStatus?: string;
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

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export function OrdersClient() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebounce(searchInput, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-orders", page, status, paymentStatus, debouncedQuery],
    queryFn: () =>
      fetchOrders({ page, status, paymentStatus, query: debouncedQuery }),
  });

  const updateMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated successfully");
    },
    onError: () => {
      toast.error("Failed to update order");
    },
  });

  const orders = data?.orders ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateMutation.mutate({ orderId, status: newStatus });
  };

  const handlePaymentStatusChange = (orderId: string, newPaymentStatus: string) => {
    updateMutation.mutate({ orderId, paymentStatus: newPaymentStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground mt-2">
            Manage customer guest orders and update order statuses.
          </p>
        </div>
      </div>

      {/* Main card */}
      <Card className="mt-8">
        <CardHeader className="py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl font-bold">All Orders</CardTitle>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search email, name or order ID..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-full"
                />
              </div>
              
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={paymentStatus}
                onValueChange={(v) => {
                  setPaymentStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto scrollbar-none">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-25">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-destructive">
                  Failed to load orders
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const firstImg =
                  order.orderItems[0]?.product.images.find((i) => i.isPrimary) ??
                  order.orderItems[0]?.product.images[0];

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {order.customerName || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.orderItems.slice(0, 2).map((item) => {
                            const img =
                              item.product.images.find((i) => i.isPrimary) ??
                              item.product.images[0];
                            return img ? (
                              <div
                                key={item.id}
                                className="h-8 w-8 overflow-hidden rounded border-2 border-background"
                              >
                                <ProductImage
                                  src={img.image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  fallbackSize="sm"
                                />
                              </div>
                            ) : (
                              <div
                                key={item.id}
                                className="flex h-8 w-8 items-center justify-center rounded border-2 border-background bg-muted"
                              >
                                <Package className="h-3 w-3" />
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {order.orderItems.length}{" "}
                          {order.orderItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">
                        {(order.deliveryOption || "").replace(/_/g, " ")}
                      </span>
                      {order.deliveryCharge > 0 && (
                        <span className="block text-[10px] text-muted-foreground">₹{order.deliveryCharge}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full text-[10px] ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-full text-[10px] ${getPaymentStatusColor(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`} className="flex items-center cursor-pointer">
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-xs font-medium">
                            Update Status
                          </DropdownMenuItem>
                          {["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
                            .filter((s) => s !== order.status)
                            .map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(order.id, s)}
                              >
                                {s === "CONFIRMED" && <CheckCircle className="mr-2 h-3 w-3" />}
                                {s === "SHIPPED" && <Truck className="mr-2 h-3 w-3" />}
                                {s === "DELIVERED" && <Package className="mr-2 h-3 w-3" />}
                                {s === "CANCELLED" && <XCircle className="mr-2 h-3 w-3" />}
                                {s === "PENDING" && <Clock className="mr-2 h-3 w-3" />}
                                Mark as {s.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-xs font-medium">
                            Update Payment
                          </DropdownMenuItem>
                          {["PENDING", "COMPLETED", "FAILED", "REFUNDED"]
                            .filter((s) => s !== order.paymentStatus)
                            .map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handlePaymentStatusChange(order.id, s)}
                              >
                                Mark payment {s.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} order{total !== 1 ? "s" : ""} total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
