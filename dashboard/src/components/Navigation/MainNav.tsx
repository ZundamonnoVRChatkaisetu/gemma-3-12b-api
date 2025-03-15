"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, LightbulbIcon, FolderIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/theme/mode-toggle"

export function MainNav() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: "/",
      label: "チャット",
      icon: MessageSquare,
      active: pathname === "/"
    },
    {
      href: "/projects",
      label: "プロジェクト",
      icon: FolderIcon,
      active: pathname === "/projects" || pathname.startsWith("/chat/")
    },
    {
      href: "/reasoning",
      label: "推論ツール",
      icon: LightbulbIcon,
      active: pathname === "/reasoning" 
    }
  ]

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6 mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Gemma 3</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm transition-colors hover:text-primary",
                route.active 
                  ? "font-medium text-foreground" 
                  : "text-muted-foreground font-normal"
              )}
            >
              <route.icon className="h-5 w-5 mr-2" />
              {route.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
