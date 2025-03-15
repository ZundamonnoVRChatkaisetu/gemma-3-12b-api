"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Brain, FileText, Settings, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * ヘッダーナビゲーションコンポーネント
 * アプリケーション全体のナビゲーションと機能へのアクセスを提供
 */
export function Header() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "チャット",
      path: "/",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "推論ツール",
      path: "/reasoning",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      name: "ファイル",
      path: "/files",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary">Gemma 3</span>
            </Link>

            <nav className="hidden md:flex ml-10">
              <ul className="flex space-x-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* テーマ切り替えボタン */}
            <ThemeToggle />

            {/* 設定メニュードロップダウン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">設定</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>アプリケーション設定</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/settings/profile" className="flex w-full">プロフィール設定</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings/api" className="flex w-full">API設定</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings/appearance" className="flex w-full">外観設定</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* モバイルメニューボタン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">メニュー</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="md:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link href={item.path} className="flex items-center w-full">
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
