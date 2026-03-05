"use client"

import { SidebarIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

function toTitle(segment: string) {
  return segment
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function SiteHeader({ userEmail }: { userEmail: string }) {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Assuming /admin is the root for this layout
  const adminIndex = segments.indexOf("admin")
  const breadcrumbSegments = adminIndex !== -1 ? segments.slice(adminIndex) : segments

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background transition-all duration-300 ease-in-out">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbSegments.map((segment, index) => {
              const isLast = index === breadcrumbSegments.length - 1
              const href = "/" + segments.slice(0, adminIndex + index + 1).join("/")
              const title = toTitle(segment)

              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
