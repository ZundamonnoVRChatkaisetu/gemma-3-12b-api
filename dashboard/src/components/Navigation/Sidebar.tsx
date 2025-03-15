"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Brain,
  FileText,
  Settings,
  History,
  Book,
  ChevronRight,
  PanelLeft,
  BookOpen,
  FileCode,
  Sparkles,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isCollapsed?: boolean;
}

/**
 * サイドバー項目コンポーネント
 */
function SidebarItem({
  icon,
  label,
  href,
  isActive = false,
  isCollapsed = false,
}: SidebarItemProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {icon}
            {!isCollapsed && <span>{label}</span>}
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

interface SidebarProps {
  className?: string;
}

/**
 * サイドバーナビゲーションコンポーネント
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      section: "メイン",
      items: [
        {
          icon: <MessageSquare className="h-5 w-5" />,
          label: "チャット",
          href: "/",
        },
        {
          icon: <Brain className="h-5 w-5" />,
          label: "推論ツール",
          href: "/reasoning",
        },
        {
          icon: <FileText className="h-5 w-5" />,
          label: "ファイル",
          href: "/files",
        },
      ],
    },
    {
      section: "ツール",
      items: [
        {
          icon: <Sparkles className="h-5 w-5" />,
          label: "テキスト生成",
          href: "/tools/text-generation",
        },
        {
          icon: <FolderTree className="h-5 w-5" />,
          label: "データ分析",
          href: "/tools/data-analysis",
        },
        {
          icon: <FileCode className="h-5 w-5" />,
          label: "コード分析",
          href: "/tools/code-analysis",
        },
      ],
    },
    {
      section: "履歴",
      items: [
        {
          icon: <History className="h-5 w-5" />,
          label: "最近の会話",
          href: "/history/recent",
        },
        {
          icon: <BookOpen className="h-5 w-5" />,
          label: "保存済み会話",
          href: "/history/saved",
        },
      ],
    },
    {
      section: "設定",
      items: [
        {
          icon: <Settings className="h-5 w-5" />,
          label: "設定",
          href: "/settings",
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r border-border bg-card",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Gemma 3</span>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
          <PanelLeft
            className={cn(
              "h-5 w-5 transition-all",
              isCollapsed && "rotate-180"
            )}
          />
          <span className="sr-only">
            {isCollapsed ? "展開する" : "折りたたむ"}
          </span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-3">
          {navItems.map((section) => (
            <div key={section.section} className="space-y-2">
              {!isCollapsed && (
                <div className="px-3">
                  <h2 className="text-xs font-semibold text-muted-foreground">
                    {section.section}
                  </h2>
                  <Separator className="my-1" />
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
