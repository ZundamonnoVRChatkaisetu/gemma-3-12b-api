"use client";

import React, { useState } from "react";
import { reasoningService, DetailLevel, ComparisonResult } from "../../lib/services/reasoning-service";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { ReloadIcon, PlusIcon, TrashIcon, TrophyIcon } from "lucide-react";
import { Progress } from "../../components/ui/progress";
import { useToast } from "../../components/ui/use-toast";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

const detailLevelOptions = [
  { value: "low", label: "簡潔" },
  { value: "medium", label: "標準" },
  { value: "high", label: "詳細" },
];

export function OptionsComparison() {
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
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
    setResult(null);

    try {
      const response = await reasoningService.compareOptions({
        question,
        options: validOptions,
        criteria: criteria.length > 0 ? criteria : undefined,
        context: context || undefined,
        detail_level: detailLevel,
      });

      setResult(response.result);
      setProcessingTime(response.time_seconds);
      toast({
        title: "比較が完了しました",
        description: `処理時間: ${response.time_seconds.toFixed(2)}秒`,
      });
    } catch (error) {
      console.error("比較エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "比較の実行中に問題が発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">選択肢の比較</CardTitle>
          <CardDescription>
            複数の選択肢を比較して最適なものを選択します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="question" className="text-sm font-medium">
                  比較の質問または目的
                </Label>
                <Textarea
                  id="question"
                  placeholder="何を比較したいですか？例: 「休暇先として最適な都市はどこですか？」"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[80px] mt-1"
                  disabled={isLoading}
                />
              </div>

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
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    比較中...
                  </>
                ) : (
                  "選択肢を比較する"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center mb-2">比較処理中...</p>
            <Progress value={66} className="h-2" />
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
              比較結果
              {processingTime && (
                <span className="ml-auto text-sm text-gray-500">
                  処理時間: {processingTime.toFixed(2)}秒
                </span>
              )}
            </CardTitle>
            <CardDescription>
              最適な選択肢: {result.best_option}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* ランキング */}
              <div>
                <h3 className="text-sm font-medium mb-2">ランキング:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  {result.ranking.map((option, index) => (
                    <li key={index} className={index === 0 ? "font-semibold" : ""}>
                      {option}
                    </li>
                  ))}
                </ol>
              </div>

              {/* 各選択肢の評価 */}
              <div>
                <h3 className="text-sm font-medium mb-2">評価詳細:</h3>
                <div className="space-y-4">
                  {result.evaluations.map((evaluation, index) => (
                    <Card key={index}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-md flex items-center">
                          {evaluation.option}
                          <Badge className="ml-auto" variant="outline">
                            スコア: {evaluation.score}/100
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">長所:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {evaluation.pros.map((pro, i) => (
                                <li key={i} className="text-sm text-green-700">
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">短所:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {evaluation.cons.map((con, i) => (
                                <li key={i} className="text-sm text-red-700">
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 理由 */}
              <div>
                <h3 className="text-sm font-medium mb-2">選択理由:</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap text-sm">{result.reasoning}</p>
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
                setOptions(["", ""]);
                setCriteria([]);
                setContext("");
              }}
            >
              クリア
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `比較質問: ${question}\n\n` +
                  (context ? `コンテキスト: ${context}\n\n` : "") +
                  `選択肢:\n${options.filter(o => o.trim() !== "").map(o => `- ${o}`).join("\n")}\n\n` +
                  (criteria.length > 0 ? `評価基準:\n${criteria.map(c => `- ${c}`).join("\n")}\n\n` : "") +
                  `ランキング:\n${result.ranking.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n` +
                  `最適な選択肢: ${result.best_option}\n\n` +
                  `選択理由: ${result.reasoning}`
                );
                toast({
                  title: "比較結果をコピーしました",
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
