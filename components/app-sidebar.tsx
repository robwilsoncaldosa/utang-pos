"use client"

import * as React from "react"
import {
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Logs,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { AdminTableName } from "@/lib/admin/entity-config"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarUser = {
  name: string
  email: string
  avatar: string
}

const tablePath: Record<AdminTableName, string> = {
  categories: "/admin/categories",
  products: "/admin/products",
  orders: "/admin/orders",
  order_items: "/admin/order_items",
  user_roles: "/admin/user_roles",
  audit_logs: "/admin/audit_logs",
}

export function AppSidebar({
  user,
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser
  role: string
}) {
  const pathname = usePathname()
  const navMain = [
    {
      title: "Overview",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: pathname === "/admin",
    },
    {
      title: "Catalog",
      url: tablePath.categories,
      icon: FolderTree,
      isActive: pathname.startsWith("/admin/categories") || pathname.startsWith("/admin/products"),
      items: [
        { title: "Categories", url: tablePath.categories },
        { title: "Products", url: tablePath.products },
      ],
    },
    {
      title: "Sales",
      url: tablePath.orders,
      icon: ShoppingCart,
      isActive: pathname.startsWith("/admin/orders") || pathname.startsWith("/admin/order_items"),
      items: [
        { title: "Orders", url: tablePath.orders },
        { title: "Order Items", url: tablePath.order_items },
      ],
    },
    {
      title: "Access",
      url: tablePath.user_roles,
      icon: ShieldCheck,
      isActive: pathname.startsWith("/admin/user_roles") || pathname.startsWith("/admin/audit_logs"),
      items: [
        { title: "User Roles", url: tablePath.user_roles },
        { title: "Audit Logs", url: tablePath.audit_logs },
      ],
    },
  ]

  return (
    <Sidebar
      collapsible="offcanvas"
      className="h-full"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">UTang POS</span>
                  <span className="truncate text-xs">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Orders">
              <Link href={tablePath.orders}>
                <ReceiptText />
                <span>Order Queue</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Audit">
              <Link href={tablePath.audit_logs}>
                <Logs />
                <span>Audit Trail</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Roles">
              <Link href={tablePath.user_roles}>
                <ClipboardList />
                <span>{role}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
