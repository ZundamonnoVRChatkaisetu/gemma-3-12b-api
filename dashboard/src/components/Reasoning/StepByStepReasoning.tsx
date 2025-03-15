"use client";

import React, { useState, useRef, useEffect } from "react";
import { reasoningService, DetailLevel, StepByStepResult, ChatMessage } from "@/lib/services/reasoning-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCw, CheckIcon, AlertTriangle, Send, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { MessageContent } from "@/components/MessageContent";

const detailLevelOptions = [
  { value: "low", label: "簡潔" },
  { value: "medium", label: "標準" },
  { value: "high", label: "詳細" },
];

interface Message {
  id: string;
  type: 'question' | 'response';
  content: string;
  result?: StepByStepResult;
  context?: string;
  detailLevel?: DetailLevel;
  timestamp: string;
}

export function StepByStepReasoning() {
  const [input, setInput] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
      role: msg.type === 'question' ? 'user' : 'assistant',
      content: msg.type === 'question' ? msg.content : 
               msg.result ? `最終回答: ${msg.result.answer}` : msg.content
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) {
      toast({
        title: "質問が入力されていません",
        description: "分析するには質問を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 質問メッセージを追加
    const newQuestionMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content: input,
      context: context || undefined,
      detailLevel,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newQuestionMessage]);

    try {
      // 過去の会話履歴を作成
      const chatHistory = createChatHistory();

      console.log("推論リクエスト送信:", {
        question: input,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      const response = await reasoningService.performStepByStepReasoning({
        question: input,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      console.log("推論レスポンス受信:", response);
      
      // 応答メッセージを追加
      const newResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: `最終回答: ${response.result.answer}`,
        result: response.result,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newResponseMessage]);

      toast({
        title: "推論が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });

      // 入力フォームをクリア
      setInput("");
      // コンテキストはそのまま残す（必要に応じてクリアすることも可能）
    } catch (error) {
      console.error("推論エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "推論の実行中に問題が発生しました。";
      setError(errorMessage);
      
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

  // メッセージをコピーする
  const copyMessageToClipboard = (index: number) => {
    if (!messages[index]) return;
    
    const message = messages[index];
    let textToCopy = message.content;
    
    // 応答メッセージの場合は詳細情報も含める
    if (message.type === 'response' && message.result) {
      textToCopy = `思考ステップ:\n${message.result.steps.join("\n")}\n\n最終回答: ${message.result.answer}\n\n確信度: ${message.result.confidence}%`;
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
            <CardTitle className="text-xl">ステップバイステップ推論</CardTitle>
            <CardDescription>
              複雑な問題を論理的なステップに分解して思考プロセスを追跡します
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
                <h3 className="text-xl font-medium mb-2">ステップバイステップ推論を始めましょう</h3>
                <p className="text-muted-foreground mb-4">
                  下のフォームに質問や問題を入力して、論理的な思考プロセスを確認できます。会話を続けると推論エンジンは以前の会話内容を記憶して回答します。
                </p>
                <div className="bg-muted p-4 rounded-lg max-w-md mx-auto text-sm">
                  <p className="font-medium mb-2">例えば以下のような質問を試してみてください：</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>日本の人口は2050年に何人程度になるでしょうか？</li>
                    <li>気候変動に対して個人ができる最も効果的な対策は何ですか？</li>
                    <li>人工知能は今後10年でどのように発展するでしょうか？</li>
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
                    message.type === 'question' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[80%] relative group ${
                      message.type === 'question'
                        ? 'bg-blue-500 text-white'
                        : 'bg-card border border-gray-200 text-card-foreground'
                    }`}
                  >
                    {/* 通常のテキストメッセージ */}
                    <MessageContent 
                      content={message.content} 
                      isUser={message.type === 'question'} 
                    />
                    
                    {/* 思考ステップの表示（応答メッセージの場合のみ） */}
                    {message.type === 'response' && message.result && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium mb-2">思考ステップ:</p>
                        <div className="text-sm space-y-2">
                          {message.result.steps.map((step, idx) => (
                            <div key={idx} className="pl-2 border-l-2 border-blue-200">
                              {step}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          確信度: {message.result.confidence}% | 
                          推論品質: {message.result.reasoning_quality}
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
              placeholder="質問または問題を入力してください..."
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

      {/* エラー表示 */}
      {error && (
        <Card className="mt-4 border-red-400">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              エラーが発生しました
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-red-800">対処方法:</h4>
                <ul className="list-disc pl-5 text-sm text-red-700 mt-2">
                  <li>APIサーバーが起動していることを確認してください（通常はポート8000で実行）</li>
                  <li>フロントエンドとAPIサーバー間のCORS設定が正しいことを確認してください</li>
                  <li>APIエンドポイントのパスが正しいことを確認してください</li>
                  <li>開発者ツールのネットワークタブでリクエストの詳細を確認してください</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
