import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_TABLE_ORDER, ADMIN_TABLE_CONFIGS } from "@/lib/admin/entity-config";
import { getDashboardMetrics } from "@/server/admin/data";
import Link from "next/link";

export default async function AdminPage() {
  const metrics = await getDashboardMetrics();
  const cards = [
    { label: "Total Revenue", value: `₱ ${metrics.totalRevenue.toFixed(2)}` },
    { label: "Completed Orders", value: String(metrics.completedOrders) },
    { label: "Pending Orders", value: String(metrics.pendingOrders) },
    { label: "Low Stock Products", value: String(metrics.lowStockProducts) },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor metrics and manage all database entities.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Entity Management</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_TABLE_ORDER.map((table) => (
            <Link
              key={table}
              href={`/admin/${table}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{ADMIN_TABLE_CONFIGS[table].label}</span>
                <Badge variant="secondary">{metrics.tableCounts[table]}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {ADMIN_TABLE_CONFIGS[table].description}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
