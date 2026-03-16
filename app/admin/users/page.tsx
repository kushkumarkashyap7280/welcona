import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getAdminUsersFilter } from "@/lib/actions/admin-users";
import { Search, MapPin, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin - Users",
};

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/login");

  const searchParams = await props.searchParams;
  const q = searchParams.q ?? "";
  const page = parseInt(searchParams.page ?? "1");

  const { users, totalPages, total } = await getAdminUsersFilter(q, page, 15);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage all registered users and their details.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <form action="/admin/users" className="relative flex-1 flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by email or name..."
            className="w-full rounded-l-md border border-border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
          />
          <Button type="submit" variant="secondary" className="rounded-l-none border border-l-0 border-border">
            Search
          </Button>
        </form>
        {q && (
          <Button variant="ghost" asChild>
            <Link href="/admin/users">Clear</Link>
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mobile</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-center">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found matching "{q}".
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle">
                      <div className="font-medium">{user.fullName || "—"}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{user.email}</div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{user.mobile || "—"}</td>
                    <td className="p-4 align-middle text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${user.blocked ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                        {user.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(user.createdAt))}
                    </td>
                    <td className="p-4 align-middle">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${user.id}`}>View Details</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
