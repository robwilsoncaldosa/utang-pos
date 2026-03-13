"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ListOrdered,
  Package,
  PackageSearch,
  ShoppingBasket,
  Tags,
  UserCog,
} from "lucide-react"
import Link from "next/link"

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
}

export function AppSidebar({
  user,
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser
  role: string
}) {
  const navMain = [
    {
      title: "Overview",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Categories",
      url: tablePath.categories,
      icon: Tags,
    },
    {
      title: "Products",
      url: tablePath.products,
      icon: PackageSearch,
    },
    {
      title: "Orders",
      url: tablePath.orders,
      icon: ShoppingBasket,
    },
    {
      title: "Order Items",
      url: tablePath.order_items,
      icon: ListOrdered,
    },
    {
      title: "User Roles",
      url: tablePath.user_roles,
      icon: UserCog,
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Current role">
              <Link href={tablePath.user_roles}>
                <UserCog />
                <span>{role}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
