'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { OnlineStatusContainer } from '@/components/data/onlineStatus'

import {
  HomeIcon,
  ShoppingBagIcon,
  PackageIcon,
  CreditCardIcon,
  UsersIcon,
  BoxIcon,
  TagIcon,
  ScaleIcon,
  DollarSignIcon,
  MapPinIcon,
  MegaphoneIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MenuIcon,
  ExpandIcon,
  ListCollapseIcon,
  WifiIcon,
  WifiOffIcon,
  Box,
  CreditCard,
  DollarSign,
  LogOut,
  MapPin,
  Megaphone,
  Package,
  Scale,
  Settings,
  ShoppingBag,
  Tag,
  Users
} from 'lucide-react'
import { usePhoenixChannel } from '@/lib/usePhoenixChannel'
import { useLogin } from '@/lib/useLogin'

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
    name: "Dashboard",
    items: [
      { name: "Overview", href: "/dashboard", icon: HomeIcon },
    ]
  },
  {
    name: "Sellers",
    items: [
      { name: "Sellers", href: "/sellers", icon: Users, countKey: "total_sellers" },
      { name: "Membership Packages", href: "/membership_packages", icon: Package },
      { name: "Payments", href: "/payments", icon: CreditCard },
      { name: "Paid Memberships", href: "/paid_memberships", icon: ShoppingBag },
    ]
  },
  {
    name: "Buyers",
    items: [
      { name: "Buyers", href: "/buyers", icon: Users },

    ]
  },
  {
    name: "Products",
    items: [
      { name: "Brands", href: "/brands", icon: Box },
      { name: "Categories", href: "/categories", icon: Box },
      { name: "Products", href: "/products", icon: Box },
      { name: "Variants", href: "/variants", icon: Tag },
      { name: "Unit of Measurement", href: "/unit_measurements", icon: Scale },
      { name: "Price Groups", href: "/price_groups", icon: DollarSign },
    ]
  },
  {
    name: "Operations",
    items: [
      { name: "Locations", href: "/locations", icon: MapPin },
      { name: "Marketing Campaigns", href: "/marketing_campaigns", icon: Megaphone },
      { name: "Marketing Banners", href: "/marketing_banners", icon: Megaphone },
      { name: "Participating Products", href: "/marketing_banner_products", icon: Megaphone },
      { name: "Staffs", href: "/staffs", icon: Users },
    ]
  },
  {
    name: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Banner Positions", href: "/banner_positions", icon: Settings },
      { name: "Roles", href: "/roles", icon: Settings },
      { name: "App Routes", href: "/app_routes", icon: Settings },
      { name: "Logout", href: "/login", icon: LogOut },
    ]
  }
]

interface NavGroupProps {
  sidebarTitle: string,
  sidebarSubtitle: string
  navGroups: NavGroup[]
}

export default function Sidebar({
  sidebarTitle = 'Next Admin',
  sidebarSubtitle = 'Dashboard',
  navGroups = defaultNavGroups,

}: NavGroupProps) {
  const { handleLogout, error } = useLogin()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const pathname = usePathname()
  const { counts, isConnected } = usePhoenixChannel()
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const isGroupCollapsed = (groupName: string) => collapsedGroups.includes(groupName)

  const toggleAllGroups = () => {
    if (collapsedGroups.length === navGroups.length) {
      setCollapsedGroups([])
    } else {
      setCollapsedGroups(navGroups.map(group => group.name))
    }
  }

  useEffect(() => {
    // Reset collapsed groups when sidebar is collapsed
    if (isSidebarCollapsed) {
      setCollapsedGroups([])
    }
  }, [isSidebarCollapsed])

  return (
    <nav className={cn(
      "z-50 bg-white shadow-md transition-all duration-300 flex flex-col",
      isSidebarCollapsed ? "w-16" : "w-64",
 
    )}>
      <div className="p-4 flex justify-between items-center">
        {!isSidebarCollapsed &&
          <>
            <OnlineStatusContainer isOnline={isConnected} className='w-full flex flex-col'>
              <h1 className="text-lg font-bold text-gray-800">{sidebarTitle}</h1>
              <div className='text-xs text-gray-500'>{sidebarSubtitle}</div>
            </OnlineStatusContainer>
          </>}
        <div className="flex space-x-2 items-center">
          {!isSidebarCollapsed && (
            <>
              <Button variant="ghost" size="icon" onClick={toggleAllGroups}>
                {collapsedGroups.length === navGroups.length ? <ExpandIcon className="h-4 w-4" /> : <ListCollapseIcon className="h-4 w-4" />}
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <div className={cn("space-y-4 ", !isSidebarCollapsed ? "lg:p-4" : "")}>
          {navGroups.map((group, groupIndex) => (
            <div key={group.name}>
              {groupIndex > 0 && <Separator className="my-2" />}
              {!isSidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full px-4 py-2 flex items-center justify-between text-sm font-semibold text-gray-500 hover:bg-gray-100"
                >
                  {group.name}
                  {isGroupCollapsed(group.name) ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </button>
              )}
              <ul className={cn(
                "space-y-1 py-2",
                isSidebarCollapsed || !isGroupCollapsed(group.name) ? "block" : "hidden"
              )}>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                        pathname === item.href
                          ? "bg-gray-200 text-gray-900"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        isSidebarCollapsed ? "justify-center" : "justify-between"
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className={cn("h-5 w-5", isSidebarCollapsed ? "mr-0" : "mr-3")} />
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!isSidebarCollapsed && item.countKey && counts[item.countKey] !== undefined && (
                        <Badge variant="secondary" className="ml-auto">
                          {counts[item.countKey]}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <ul className=' "space-y-1 py-2"'>
            <li key={'logout'}>
              <Button variant={'ghost'}
                onClick={() => {
                  handleLogout()
                }}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                  pathname === '/login'
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isSidebarCollapsed ? "justify-center" : "justify-between"
                )}
              >
                <div className="flex items-center">
                  <LogOut className={cn("h-5 w-5", isSidebarCollapsed ? "mr-0" : "mr-3")} />
                  {!isSidebarCollapsed && <span>{'logout'}</span>}
                </div>

              </Button>
            </li>
          </ul>

        </div>
      </ScrollArea>
    </nav>
  )
}