"use client";

import React, { useState } from "react";
import { reasoningService, DetailLevel, StepByStepResult } from "@/lib/services/reasoning-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

const detailLevelOptions = [
  { value: "low", label: "簡潔" },
  { value: "medium", label: "標準" },
  { value: "high", label: "詳細" },
];

export function StepByStepReasoning() {
  const [question, setQuestion] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [result, setResult] = useState<StepByStepResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast({
        title: "質問が入力されていません",
        description: "分析するには質問を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await reasoningService.performStepByStepReasoning({
        question,
        context: context || undefined,
        detail_level: detailLevel,
      });

      setResult(response.result);
      setProcessingTime(response.time_seconds);
      toast({
        title: "推論が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });
    } catch (error) {
      console.error("推論エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "推論の実行中に問題が発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ステップバイステップ推論</CardTitle>
          <CardDescription>
            複雑な問題を論理的なステップに分解して思考プロセスを追跡します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question" className="text-sm font-medium">
                  質問または問題
                </Label>
                <Textarea
                  id="question"
                  placeholder="ここに分析したい質問を入力してください..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px] mt-1"
                  disabled={isLoading}
                />
              </div>

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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    推論中...
                  </>
                ) : (
                  "思考プロセスを開始"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center mb-2">推論処理中...</p>
            <Progress value={66} className="h-2" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
              推論結果
              {processingTime && (
                <span className="ml-auto text-sm text-gray-500">
                  処理時間: {processingTime.toFixed(2)}秒
                </span>
              )}
            </CardTitle>
            <CardDescription>
              確信度: {result.confidence}% | 推論品質: {result.reasoning_quality}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">思考ステップ:</h3>
                <div className="rounded-md bg-muted p-4">
                  {result.steps.map((step, index) => (
                    <div key={index} className="mb-3">
                      <p className="whitespace-pre-wrap">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">最終回答:</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap">{result.answer}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setQuestion("");
                setContext("");
              }}
            >
              クリア
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `問題: ${question}\n\n` +
                  (context ? `コンテキスト: ${context}\n\n` : "") +
                  `思考ステップ:\n${result.steps.join("\n")}\n\n` +
                  `最終回答: ${result.answer}\n\n` +
                  `確信度: ${result.confidence}%`
                );
                toast({
                  title: "推論結果をコピーしました",
                  description: "クリップボードにコピーされました。",
                });
              }}
            >
              結果をコピー
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
