"use client";

import React, { useState } from "react";
import { reasoningService, DetailLevel, EvaluationResult } from "@/lib/services/reasoning-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircleIcon, XCircleIcon, HelpCircleIcon, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

const detailLevelOptions = [
  { value: "low", label: "簡潔" },
  { value: "medium", label: "標準" },
  { value: "high", label: "詳細" },
];

export function StatementEvaluator() {
  const [statement, setStatement] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!statement.trim()) {
      toast({
        title: "評価する文が入力されていません",
        description: "評価するには文を入力してください。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await reasoningService.evaluateStatement({
        statement,
        context: context || undefined,
        detail_level: detailLevel,
      });

      setResult(response.result);
      setProcessingTime(response.time_seconds);
      toast({
        title: "評価が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });
    } catch (error) {
      console.error("評価エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "評価の実行中に問題が発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 評価結果に基づいてアイコンとカラーを取得
  const getEvaluationDisplay = () => {
    if (result === null) return { icon: null, color: "", text: "" };

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

  const evaluationDisplay = getEvaluationDisplay();

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">文の真偽評価</CardTitle>
          <CardDescription>
            文の真偽を評価し、確信度と根拠を示します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="statement" className="text-sm font-medium">
                  評価する文
                </Label>
                <Textarea
                  id="statement"
                  placeholder="ここに評価したい文を入力してください..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
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
                    評価中...
                  </>
                ) : (
                  "文を評価する"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center mb-2">評価処理中...</p>
            <Progress value={66} className="h-2" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              {evaluationDisplay.icon}
              <span className="ml-2">評価結果</span>
              {processingTime && (
                <span className="ml-auto text-sm text-gray-500">
                  処理時間: {processingTime.toFixed(2)}秒
                </span>
              )}
            </CardTitle>
            <CardDescription className="flex items-center mt-2">
              <Badge className={`mr-2 ${evaluationDisplay.color}`}>
                {evaluationDisplay.text}
              </Badge>
              確信度: {result.confidence}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">根拠:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {result.evidence.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {result.uncertainties && result.uncertainties.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">不確実性:</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {result.uncertainties.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">結論:</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap text-sm">{result.conclusion}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setStatement("");
                setContext("");
              }}
            >
              クリア
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `評価対象: ${statement}\n\n` +
                  (context ? `コンテキスト: ${context}\n\n` : "") +
                  `評価結果: ${evaluationDisplay.text} (確信度: ${result.confidence}%)\n\n` +
                  `根拠:\n${result.evidence.map(e => `- ${e}`).join("\n")}\n\n` +
                  (result.uncertainties && result.uncertainties.length > 0
                    ? `不確実性:\n${result.uncertainties.map(u => `- ${u}`).join("\n")}\n\n`
                    : "") +
                  `結論: ${result.conclusion}`
                );
                toast({
                  title: "評価結果をコピーしました",
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
