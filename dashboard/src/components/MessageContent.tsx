"use client";

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  value: string;
}

interface MessageContentProps {
  content: string;
  isUser?: boolean;
}

// Regular expression to detect code blocks with language specification
// Matches ```language\ncode``` or ```code```
const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-md overflow-hidden">
      {/* Language indicator */}
      {language && (
        <div className="bg-gray-800 text-gray-200 py-1 px-4 text-xs font-mono">
          {language}
        </div>
      )}
      
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      
      {/* Code content */}
      <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-200 text-sm font-mono">
        <code>{value}</code>
      </pre>
    </div>
  );
};

// Component to render message content with code block detection
export const MessageContent: React.FC<MessageContentProps> = ({ content, isUser = false }) => {
  // Store last index to track where normal text ends
  let lastIndex = 0;
  // Array to hold all parts of the message (text and code blocks)
  const parts: React.ReactNode[] = [];
  // Clone the regex to avoid issues with global flag
  const regex = new RegExp(codeBlockRegex);
  let match;
  let matchIndex = 0;

  // Find all code blocks in the content
  while ((match = regex.exec(content)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${matchIndex}`} className="whitespace-pre-wrap">
          {content.substring(lastIndex, match.index)}
        </span>
      );
    }
    
    // Add the code block
    const language = match[1] || '';
    const code = match[2];
    
    parts.push(
      <CodeBlock key={`code-${matchIndex}`} language={language} value={code} />
    );
    
    lastIndex = regex.lastIndex;
    matchIndex++;
  }
  
  // Add any remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${matchIndex}`} className="whitespace-pre-wrap">
        {content.substring(lastIndex)}
      </span>
    );
  }
  
  // If no code blocks were found, just return the content as is
  if (parts.length === 0) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
  
  return (
    <div className={cn(
      isUser ? "text-white" : "text-gray-800"
    )}>
      {parts}
    </div>
  );
};
