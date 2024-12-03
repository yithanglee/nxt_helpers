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
    name: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Roles", href: "/roles", icon: Settings },
      { name: "App Routes", href: "/app_routes", icon: Settings },
      { name: "Logout", href: "/login", icon: LogOut },
    ]
  }
]

interface NavGroupProps {
  userRole?: string,
  allowRoutes?: string[],
  sidebarTitle: string,
  sidebarSubtitle: string
  navGroups: NavGroup[]
}

export default function Sidebar({
  userRole = 'admin',
  allowRoutes = [],
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
      "bg-white shadow-md transition-all duration-300 flex flex-col",
      isSidebarCollapsed ? "w-12" : "w-64"
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

        <div className="space-y-4 py-4 lg:p-4 lg:px-4">
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
              {userRole == 'admin' && <ul className={cn(
                "space-y-1 py-2",
                isSidebarCollapsed || !isGroupCollapsed(group.name) ? "block" : "hidden"
              )}>
                {group.items.map((item) =>

                (<li key={item.name}>
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
                </li>)

                )}
              </ul>}
              {userRole != 'admin' && <ul className={cn(
                "space-y-1 py-2",
                isSidebarCollapsed || !isGroupCollapsed(group.name) ? "block" : "hidden"
              )}>
                {group.items.filter(item => allowRoutes.includes(item.href)).map((item) =>

                (<li key={item.name}>
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
                </li>)

                )}
              </ul>}
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
        <div className=" space-y-4 p-4 text-xs text-gray-500">Role: {userRole}</div>
    
      </ScrollArea>
    </nav>
  )
}