import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  link: string
  title: string
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

const BreadcrumbHelper = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("mb-4", className)}
        {...props}
      >
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Home
            </Link>
          </li>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <li>
                {index === items.length - 1 || !item.link ? (
                  <span className="text-sm font-medium text-foreground" aria-current="page">
                    {item.title}
                  </span>
                ) : (
                  <Link href={item.link} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    {item.title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>
    )
  }
)

BreadcrumbHelper.displayName = "Breadcrumb"

export { BreadcrumbHelper }