"use client";

import React, { useState, useRef, useEffect } from "react";
import { reasoningService, DetailLevel, EvaluationResult, ChatMessage } from "@/lib/services/reasoning-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCw, CheckCircleIcon, XCircleIcon, HelpCircleIcon, Send, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { MessageContent } from "@/components/MessageContent";

const detailLevelOptions = [
  { value: "low", label: "簡潔" },
  { value: "medium", label: "標準" },
  { value: "high", label: "詳細" },
];

interface Message {
  id: string;
  type: 'statement' | 'response';
  content: string;
  result?: EvaluationResult;
  context?: string;
  detailLevel?: DetailLevel;
  timestamp: string;
}

export function StatementEvaluator() {
  const [input, setInput] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージ表示部分を常に最新にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // テキストエリアの高さを内容に合わせて自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // メッセージ履歴からChatMessage配列に変換
  const createChatHistory = (): ChatMessage[] => {
    return messages.map(msg => ({
      role: msg.type === 'statement' ? 'user' : 'assistant',
      content: msg.type === 'statement' ? `評価する文: ${msg.content}` : 
               msg.result ? `評価結果: ${msg.result.is_true === true ? '真' : msg.result.is_true === false ? '偽' : '不明/不確定'} (確信度: ${msg.result.confidence}%)` : msg.content
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast({
        title: "評価する文が入力されていません",
        description: "評価するには文を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 文のメッセージを追加
    const newStatementMessage: Message = {
      id: Date.now().toString(),
      type: 'statement',
      content: input,
      context: context || undefined,
      detailLevel,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newStatementMessage]);

    try {
      // 過去の会話履歴を作成
      const chatHistory = createChatHistory();

      console.log("評価リクエスト送信:", {
        statement: input,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      const response = await reasoningService.evaluateStatement({
        statement: input,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      console.log("評価レスポンス受信:", response);
      
      setProcessingTime(response.time_seconds);
      
      // 評価に基づく結果のテキスト
      let resultText = "評価結果: ";
      if (response.result.is_true === true) {
        resultText += "真";
      } else if (response.result.is_true === false) {
        resultText += "偽";
      } else {
        resultText += "不明/不確定";
      }
      resultText += ` (確信度: ${response.result.confidence}%)`;
      
      // 応答メッセージを追加
      const newResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: resultText,
        result: response.result,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newResponseMessage]);

      toast({
        title: "評価が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });

      // 入力フォームをクリア
      setInput("");
      // コンテキストはそのまま残す（必要に応じてクリアすることも可能）
    } catch (error) {
      console.error("評価エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "評価の実行中に問題が発生しました。";
      
      // エラーメッセージを追加
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: `エラー: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorResponse]);

      toast({
        title: "エラーが発生しました",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 評価結果に基づいてアイコンとカラーを取得
  const getEvaluationDisplay = (result: EvaluationResult) => {
    if (result.is_true === null) {
      return {
        icon: <HelpCircleIcon className="h-6 w-6 text-yellow-500" />,
        color: "bg-yellow-100 text-yellow-800",
        text: "不明/不確定",
      };
    } else if (result.is_true === true) {
      return {
        icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
        color: "bg-green-100 text-green-800",
        text: "真",
      };
    } else {
      return {
        icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
        color: "bg-red-100 text-red-800",
        text: "偽",
      };
    }
  };

  // メッセージをコピーする
  const copyMessageToClipboard = (index: number) => {
    if (!messages[index]) return;
    
    const message = messages[index];
    let textToCopy = message.content;
    
    // 応答メッセージの場合は詳細情報も含める
    if (message.type === 'response' && message.result) {
      const evaluationDisplay = getEvaluationDisplay(message.result);
      textToCopy = `評価結果: ${evaluationDisplay.text} (確信度: ${message.result.confidence}%)\n\n` +
                   `根拠:\n${message.result.evidence.map(e => `- ${e}`).join("\n")}\n\n` +
                   (message.result.uncertainties && message.result.uncertainties.length > 0
                      ? `不確実性:\n${message.result.uncertainties.map(u => `- ${u}`).join("\n")}\n\n`
                      : "") +
                   `結論: ${message.result.conclusion}`;
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedMessageIndex(index);
        setTimeout(() => setCopiedMessageIndex(null), 2000);
      })
      .catch(err => {
        console.error('メッセージのコピーに失敗しました:', err);
      });
  };

  // Enterキーで送信（Shift+Enterで改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">文の真偽評価</CardTitle>
            <CardDescription>
              文の真偽を評価し、確信度と根拠を示します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="context" className="text-sm font-medium">
                  追加コンテキスト（オプション）
                </Label>
                <Textarea
                  id="context"
                  placeholder="関連する背景情報や詳細を入力..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[80px] mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">詳細レベル</Label>
                <RadioGroup
                  value={detailLevel}
                  onValueChange={(value) => setDetailLevel(value as DetailLevel)}
                  className="flex space-x-4 mt-1"
                  disabled={isLoading}
                >
                  {detailLevelOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`detail-level-${option.value}`}
                      />
                      <Label htmlFor={`detail-level-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* チャット表示エリア */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 overflow-auto">
          <CardContent className="p-4">
            {/* 初回表示時のガイダンス */}
            {messages.length === 0 && (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">文の真偽評価を始めましょう</h3>
                <p className="text-muted-foreground mb-4">
                  下のフォームに評価したい文を入力してください。会話を続けると以前の評価結果を考慮して回答します。
                </p>
                <div className="bg-muted p-4 rounded-lg max-w-md mx-auto text-sm">
                  <p className="font-medium mb-2">例えば以下のような文を試してみてください：</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>水は摂氏0度で凍結する</li>
                    <li>日本の首都は横浜である</li>
                    <li>地球は太陽系で最も大きな惑星である</li>
                  </ul>
                </div>
              </div>
            )}

            {/* メッセージ一覧 */}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'statement' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[80%] relative group ${
                      message.type === 'statement'
                        ? 'bg-blue-500 text-white'
                        : 'bg-card border border-gray-200 text-card-foreground'
                    }`}
                  >
                    {/* 通常のテキストメッセージ */}
                    <MessageContent 
                      content={message.content} 
                      isUser={message.type === 'statement'} 
                    />
                    
                    {/* 評価結果の詳細表示（応答メッセージの場合のみ） */}
                    {message.type === 'response' && message.result && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {/* 評価結果のバッジ */}
                        {(() => {
                          const evaluationDisplay = getEvaluationDisplay(message.result);
                          return (
                            <div className="flex items-center mb-3">
                              {evaluationDisplay.icon}
                              <Badge className={`ml-2 ${evaluationDisplay.color}`}>
                                {evaluationDisplay.text}
                              </Badge>
                              <span className="ml-2 text-sm">確信度: {message.result.confidence}%</span>
                            </div>
                          );
                        })()}

                        {/* 根拠 */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">根拠:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {message.result.evidence.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* 不確実性（ある場合のみ） */}
                        {message.result.uncertainties && message.result.uncertainties.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">不確実性:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {message.result.uncertainties.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 結論 */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">結論:</p>
                          <p className="text-sm bg-muted p-2 rounded">{message.result.conclusion}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* コピーボタン */}
                    <button
                      onClick={() => copyMessageToClipboard(index)}
                      className={`absolute -top-2 -right-2 p-1 rounded-full ${
                        copiedMessageIndex === index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100'
                      } transition-all duration-200`}
                      title="メッセージをコピー"
                    >
                      {copiedMessageIndex === index ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              
              {/* ローディング表示 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-2 bg-card border border-gray-200 text-card-foreground">
                    <div className="flex items-center">
                      <div className="animate-pulse flex space-x-1">
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* スクロール用の参照ポイント */}
              <div ref={messagesEndRef}></div>
            </div>
          </CardContent>
        </Card>
        
        {/* 入力フォーム */}
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="評価したい文を入力してください..."
              className="flex-1 min-h-[40px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="self-end">
              {isLoading ? (
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
