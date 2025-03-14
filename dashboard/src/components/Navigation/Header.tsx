"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Brain, FileText } from "lucide-react";

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
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div>
            <Link href="/" className="text-xl font-bold text-gray-800">
              Gemma 3
            </Link>
          </div>

          <nav>
            <ul className="flex space-x-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
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
      </div>
    </header>
  );
}
