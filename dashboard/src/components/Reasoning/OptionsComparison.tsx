"use client";

import React, { useState, useRef, useEffect } from "react";
import { reasoningService, DetailLevel, ComparisonResult, ChatMessage } from "@/lib/services/reasoning-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCw, PlusIcon, TrashIcon, TrophyIcon, Send, Copy, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  result?: ComparisonResult;
  context?: string;
  options?: string[];
  criteria?: string[];
  detailLevel?: DetailLevel;
  timestamp: string;
}

export function OptionsComparison() {
  const [input, setInput] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState<string>("");
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
    return messages.map(msg => {
      if (msg.type === 'question') {
        const optionsText = msg.options && msg.options.length > 0 
          ? `\n選択肢:\n${msg.options.map((opt, i) => `${i+1}. ${opt}`).join('\n')}` 
          : '';
        const criteriaText = msg.criteria && msg.criteria.length > 0 
          ? `\n評価基準:\n${msg.criteria.map(c => `- ${c}`).join('\n')}` 
          : '';
        return {
          role: 'user',
          content: `${msg.content}${optionsText}${criteriaText}`
        };
      } else {
        return {
          role: 'assistant',
          content: msg.result 
            ? `最適な選択肢: ${msg.result.best_option}` 
            : msg.content
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast({
        title: "質問が入力されていません",
        description: "比較するには質問を入力してください。",
        variant: "destructive",
      });
      return;
    }

    // 空のオプションを除外
    const validOptions = options.filter(option => option.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "有効な選択肢が足りません",
        description: "少なくとも2つの選択肢が必要です。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // 質問メッセージを追加
    const optionsText = validOptions.map(option => `・${option}`).join('\n');
    const criteriaText = criteria.length > 0 
      ? `\n\n評価基準:\n${criteria.map(c => `・${c}`).join('\n')}` 
      : '';
    
    const questionContent = `${input}\n\n選択肢:\n${optionsText}${criteriaText}`;
    
    const newQuestionMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      content: input,
      context: context || undefined,
      options: validOptions,
      criteria: criteria.length > 0 ? criteria : undefined,
      detailLevel,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newQuestionMessage]);

    try {
      // 過去の会話履歴を作成
      const chatHistory = createChatHistory();

      console.log("比較リクエスト送信:", {
        question: input,
        options: validOptions,
        criteria: criteria.length > 0 ? criteria : undefined,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      const response = await reasoningService.compareOptions({
        question: input,
        options: validOptions,
        criteria: criteria.length > 0 ? criteria : undefined,
        context: context || undefined,
        detail_level: detailLevel,
        chat_history: chatHistory,
      });

      console.log("比較レスポンス受信:", response);

      setProcessingTime(response.time_seconds);
      
      // 応答メッセージを追加
      const newResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'response',
        content: `最適な選択肢: ${response.result.best_option}`,
        result: response.result,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newResponseMessage]);

      toast({
        title: "比較が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });

      // 入力フォームをクリア
      setInput("");
      // 選択肢と評価基準はそのまま残す（必要に応じてクリアすることも可能）
    } catch (error) {
      console.error("比較エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "比較の実行中に問題が発生しました。";
      
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

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "選択肢は最低2つ必要です",
        description: "選択肢を削除できません。",
        variant: "destructive",
      });
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addCriterion = () => {
    if (!newCriterion.trim()) return;
    setCriteria([...criteria, newCriterion]);
    setNewCriterion("");
  };

  const removeCriterion = (index: number) => {
    const newCriteria = [...criteria];
    newCriteria.splice(index, 1);
    setCriteria(newCriteria);
  };
  
  // メッセージをコピーする
  const copyMessageToClipboard = (index: number) => {
    if (!messages[index]) return;
    
    const message = messages[index];
    let textToCopy = message.content;
    
    // 応答メッセージの場合は詳細情報も含める
    if (message.type === 'response' && message.result) {
      const result = message.result;
      textToCopy = `最適な選択肢: ${result.best_option}\n\n` +
                   `ランキング:\n${result.ranking.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n` +
                   `選択理由: ${result.reasoning}`;
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
            <CardTitle className="text-xl">選択肢の比較</CardTitle>
            <CardDescription>
              複数の選択肢を比較して最適なものを選択します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 選択肢入力 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">選択肢</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`選択肢 ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={isLoading || options.length <= 2}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    選択肢を追加
                  </Button>
                </div>
              </div>

              {/* 評価基準 */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  評価基準（オプション）
                </Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {criteria.map((criterion, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {criterion}
                        <button
                          type="button"
                          onClick={() => removeCriterion(index)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                          disabled={isLoading}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="新しい評価基準（例: コスト、利便性）"
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCriterion}
                      disabled={isLoading || !newCriterion.trim()}
                    >
                      追加
                    </Button>
                  </div>
                </div>
              </div>

              {/* コンテキスト */}
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

              {/* 詳細レベル */}
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
                <h3 className="text-xl font-medium mb-2">選択肢の比較を始めましょう</h3>
                <p className="text-muted-foreground mb-4">
                  上のフォームに選択肢と比較したい質問を入力してください。会話を続けると以前の比較結果を考慮します。
                </p>
                <div className="bg-muted p-4 rounded-lg max-w-md mx-auto text-sm">
                  <p className="font-medium mb-2">例えば以下のような質問を試してみてください：</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>買い物に行くなら、どのスーパーマーケットが最適ですか？</li>
                    <li>次の休暇にはどの都市を訪れるべきですか？</li>
                    <li>プログラミング言語の選択として、どれが初心者に最適ですか？</li>
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
                    
                    {/* 選択肢の表示（質問メッセージの場合のみ） */}
                    {message.type === 'question' && message.options && message.options.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">選択肢:</p>
                        <ul className="list-disc pl-5">
                          {message.options.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                        {message.criteria && message.criteria.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">評価基準:</p>
                            <ul className="list-disc pl-5">
                              {message.criteria.map((criterion, idx) => (
                                <li key={idx}>{criterion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 比較結果の詳細表示（応答メッセージの場合のみ） */}
                    {message.type === 'response' && message.result && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {/* 最優秀選択肢 */}
                        <div className="flex items-center mb-3">
                          <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
                          <span className="font-medium">最適な選択肢: {message.result.best_option}</span>
                        </div>

                        {/* ランキング */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">ランキング:</p>
                          <ol className="list-decimal pl-5 space-y-1">
                            {message.result.ranking.map((option, idx) => (
                              <li key={idx} className={idx === 0 ? "font-semibold" : ""}>
                                {option}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* 評価詳細 */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">評価詳細:</p>
                          <div className="space-y-3">
                            {message.result.evaluations.map((evaluation, idx) => (
                              <div key={idx} className="border rounded-md p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="font-medium">{evaluation.option}</p>
                                  <Badge variant="outline">
                                    スコア: {evaluation.score}/100
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs font-medium mb-1">長所:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {evaluation.pros.map((pro, i) => (
                                        <li key={i} className="text-xs text-green-700">
                                          {pro}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium mb-1">短所:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {evaluation.cons.map((con, i) => (
                                        <li key={i} className="text-xs text-red-700">
                                          {con}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 選択理由 */}
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">選択理由:</p>
                          <p className="text-sm bg-muted p-2 rounded">{message.result.reasoning}</p>
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
              placeholder="比較の質問または目的を入力してください..."
              className="flex-1 min-h-[40px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim() || options.filter(o => o.trim() !== "").length < 2} 
              className="self-end"
              title={options.filter(o => o.trim() !== "").length < 2 ? "少なくとも2つの選択肢が必要です" : ""}
            >
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
