import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getAdminUserDetails } from "@/lib/actions/admin-users";
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleUserBlockButton } from "@/components/admin/users/ToggleUserBlockButton";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return { title: `User Details - ${params.id}` };
}

export default async function AdminUserDetailsPage(props: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/login");

  const params = await props.params;
  const user = await getAdminUserDetails(params.id).catch(() => null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <Button asChild variant="outline"><Link href="/admin/users">Back to Users</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-1">ID: {user.id}</p>
        </div>
        <div className="ml-auto">
          <ToggleUserBlockButton userId={user.id} currentlyBlocked={user.blocked} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-1 space-y-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" /> Profile
            </h3>
            <div className="h-px bg-border w-full my-4" />
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.fullName || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </p>
              <p className="font-medium">{user.email}</p>
              {user.verified && <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold mt-1 inline-block">Verified</span>}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone
              </p>
              <p className="font-medium">{user.mobile || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Joined
              </p>
              <p className="font-medium">
                {new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeStyle: "short" }).format(new Date(user.createdAt))}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground pb-1">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${user.blocked ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                {user.blocked ? "Blocked" : "Active"}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Addresses */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
             <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" /> Addresses
              </h3>
              <div className="h-px bg-border w-full my-4" />
            </div>
            
            {user.addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No addresses saved.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses.map((addr) => (
                  <div key={addr.id} className="border border-border/60 rounded-lg p-4 bg-muted/20 relative">
                    <p className="font-medium mb-1">{user.fullName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{user.mobile || "—"}</p>
                    <p className="text-sm text-muted-foreground mt-2">{addr.line1}</p>
                    {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}</p>
                    <p className="text-sm text-muted-foreground">{addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
             <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" /> Recent Orders
              </h3>
              <div className="h-px bg-border w-full my-4" />
            </div>

            {user.orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders found.</p>
            ) : (
              <div className="space-y-4">
                {user.orders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row gap-4 justify-between border border-border/60 rounded-lg p-4 bg-muted/20">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/admin/orders/${order.id}`} className="font-bold cursor-pointer hover:underline text-primary">
                          {order.id.split("-")[0].toUpperCase()}
                        </Link>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wide">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(order.createdAt))}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {order.orderItems.length} items • ₹{order.total.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
