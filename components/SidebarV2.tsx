"use client"
import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, GalleryVerticalEnd, LayoutDashboard, Package, Settings, User, Zap, ChevronDownIcon, ChevronRightIcon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePhoenixChannel } from '@/lib/usePhoenixChannel'
import { useLogin } from '@/lib/useLogin'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  countKey?: string
}

interface NavGroup {
  name: string
  items: NavItem[]
}

const defaultNavGroups: NavGroup[] = [
  {
    name: "Navigation",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Devices", href: "/devices", icon: Package },
    ]
  },
  {
    name: "Subscription",
    items: [
      { name: "Manage Plan", href: "/subscription", icon: CreditCard },
      { name: "Usage & Limits", href: "/subscription/usage", icon: Zap },
      { name: "Billing History", href: "/subscription/billing", icon: CreditCard }
    ]
  },
  {
    name: "Account",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Logout", href: "/login", icon: LogOut }
    ]
  }
]

interface SidebarV2Props {
  userRole?: string | null
  allowRoutes?: string[]
  sidebarTitle?: string
  sidebarSubtitle?: string
  navGroups?: NavGroup[]
}

export function SidebarV2({
  userRole = null,
  allowRoutes = [],
  sidebarTitle = 'IoT Manager',
  sidebarSubtitle = 'v1.0.0',
  navGroups = defaultNavGroups
}: SidebarV2Props) {
  const pathname = usePathname()
  const { handleLogout } = useLogin()
  const { counts, isConnected } = usePhoenixChannel()
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const isGroupCollapsed = (groupName: string) => collapsedGroups.includes(groupName)

  const hasAccess = (item: NavItem) => {
    // If no role restrictions or user is admin, allow access
    if (!userRole || userRole === 'admin') return true;
    // Otherwise check allowRoutes
    return allowRoutes.includes(item.href);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{sidebarTitle}</span>
                  <span className="text-xs text-muted-foreground">{sidebarSubtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea>
          {navGroups.map((group, groupIndex) => {
            const accessibleItems = group.items.filter(hasAccess);
            if (accessibleItems.length === 0) return null;
            
            return (
              <SidebarGroup key={group.name}>
                <div className="flex items-center justify-between px-3">
                  <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className="p-1 hover:text-accent-foreground"
                  >
                    {isGroupCollapsed(group.name) ? (
                      <ChevronRightIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {!isGroupCollapsed(group.name) && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {accessibleItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            onClick={item.name === "Logout" ? handleLogout : undefined}
                          >
                            <Link href={item.href}>
                              <item.icon className="size-4" />
                              <span>{item.name}</span>
                              {item.countKey && counts[item.countKey] !== undefined && (
                                <Badge variant="secondary" className="ml-auto">
                                  {counts[item.countKey]}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            );
          })}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/profile">
                <User className="size-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

