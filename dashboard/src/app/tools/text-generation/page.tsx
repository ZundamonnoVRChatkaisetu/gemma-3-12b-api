"use client";

import React, { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/**
 * テキスト生成ツールページ
 * 様々なスタイルとオプションでテキストを生成するための高度なインターフェース
 */
export default function TextGenerationPage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textType, setTextType] = useState('creative');
  const [language, setLanguage] = useState('japanese');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('medium');
  const [temperature, setTemperature] = useState(0.7);
  const [useStepByStepThinkinG, setUseStepByStepThinking] = useState(false);
  
  // テキストタイプのプリセット
  const textTypes = [
    { id: 'creative', label: '創作文', description: '物語、詩、脚本など創造的なテキスト' },
    { id: 'business', label: 'ビジネス文書', description: 'メール、報告書、提案書など' },
    { id: 'academic', label: '学術文書', description: '論文、レポート、研究概要など' },
    { id: 'technical', label: '技術文書', description: 'マニュアル、仕様書、ドキュメントなど' },
  ];
  
  // 言語設定
  const languages = [
    { value: 'japanese', label: '日本語' },
    { value: 'english', label: 'English' },
    { value: 'chinese', label: '中文' },
    { value: 'korean', label: '한국어' },
  ];
  
  // トーン設定
  const tones = [
    { value: 'formal', label: '形式的' },
    { value: 'neutral', label: '中立的' },
    { value: 'casual', label: 'カジュアル' },
    { value: 'humorous', label: 'ユーモラス' },
    { value: 'technical', label: '専門的' },
  ];
  
  // 長さ設定
  const lengths = [
    { value: 'short', label: '短い（100-200字）' },
    { value: 'medium', label: '中程度（300-500字）' },
    { value: 'long', label: '長い（800-1200字）' },
    { value: 'verylong', label: '非常に長い（1500字以上）' },
  ];

  // テキスト生成の実行
  const generateText = async () => {
    if (!prompt.trim()) {
      toast({
        title: "プロンプトが入力されていません",
        description: "テキスト生成のための指示を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // システムプロンプトの構築
      let systemPrompt = `あなたは高品質なテキスト生成アシスタントです。`;
      
      // テキストタイプに応じたプロンプト設定
      switch (textType) {
        case 'creative':
          systemPrompt += '創造的で魅力的なコンテンツを生成してください。';
          break;
        case 'business':
          systemPrompt += 'プロフェッショナルなビジネス文書を作成してください。';
          break;
        case 'academic':
          systemPrompt += '論理的で根拠に基づいた学術的な文書を作成してください。';
          break;
        case 'technical':
          systemPrompt += '正確で明瞭な技術文書を作成してください。';
          break;
      }
      
      // トーン設定
      systemPrompt += `\n\nトーン: ${tones.find(t => t.value === tone)?.label}`;
      
      // 長さ設定
      systemPrompt += `\n\n長さ: ${lengths.find(l => l.value === length)?.label}`;
      
      // 言語設定
      systemPrompt += `\n\n使用言語: ${languages.find(l => l.value === language)?.label}`;
      
      // ステップバイステップ思考プロセスの設定
      if (useStepByStepThinkinG) {
        systemPrompt += '\n\n思考プロセスを示したあとに最終的な生成物を提示してください。';
      }
      
      // APIリクエスト
      const response = await fetch('http://localhost:8000/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: temperature,
          max_tokens: 2048
        }),
      });
      
      if (!response.ok) {
        throw new Error('テキスト生成に失敗しました');
      }
      
      const data = await response.json();
      setOutput(data.message.content);
    } catch (error) {
      console.error('テキスト生成エラー:', error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "テキスト生成中に問題が発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // クリップボードにコピー
  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    
    toast({
      title: "コピーしました",
      description: "テキストがクリップボードにコピーされました",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">テキスト生成ツール</h1>
        <p className="text-muted-foreground mt-2">
          高品質なテキストを様々なスタイルと形式で生成します
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        {/* コントロールパネル */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>生成設定</CardTitle>
            <CardDescription>
              テキスト生成のためのオプションを設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* テキストタイプ選択 */}
            <div>
              <Label>テキストタイプ</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {textTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={textType === type.id ? "default" : "outline"}
                    className={cn("justify-start h-auto flex-col items-start px-3 py-2", 
                      textType === type.id ? "border-primary bg-primary text-primary-foreground" : "")}
                    onClick={() => setTextType(type.id)}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 text-left">
                      {type.description}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 言語選択 */}
            <div className="space-y-2">
              <Label htmlFor="language">言語</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="言語を選択" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* トーン選択 */}
            <div className="space-y-2">
              <Label htmlFor="tone">トーン</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="トーンを選択" />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 長さ選択 */}
            <div className="space-y-2">
              <Label htmlFor="length">長さ</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger id="length">
                  <SelectValue placeholder="長さを選択" />
                </SelectTrigger>
                <SelectContent>
                  {lengths.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* ランダム性の調整 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="temperature">ランダム性 ({temperature})</Label>
                <span className="text-xs text-muted-foreground">
                  {temperature <= 0.3 ? "厳格" : temperature <= 0.7 ? "バランス" : "創造的"}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0.1}
                max={1.0}
                step={0.1}
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
              />
            </div>
            
            {/* ステップバイステップ思考 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="stepByStep"
                checked={useStepByStepThinkinG}
                onCheckedChange={setUseStepByStepThinking}
              />
              <Label htmlFor="stepByStep">思考プロセスを表示</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={generateText}
              className="w-full"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                  生成中...
                </>
              ) : (
                "テキストを生成"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* 入力と出力パネル */}
        <Card className="md:col-span-3">
          <Tabs defaultValue="input">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>プロンプトと生成結果</CardTitle>
                <TabsList>
                  <TabsTrigger value="input">プロンプト</TabsTrigger>
                  <TabsTrigger value="output">生成結果</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                生成したいテキストの内容を説明してください
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="input" className="mt-0">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例: 人工知能の発展についての考察を書いてください。特に倫理的な側面に焦点を当ててください。"
                  className="min-h-[300px]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    詳細な指示ほど良い結果が得られます
                  </span>
                  <Badge variant="outline">
                    {prompt.length} 文字
                  </Badge>
                </div>
              </TabsContent>
              
              <TabsContent value="output" className="mt-0">
                {output ? (
                  <div className="relative">
                    <div className="bg-muted/50 rounded-md p-4 whitespace-pre-wrap min-h-[300px] text-sm">
                      {output}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">コピー</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] bg-muted/50 rounded-md">
                    <p className="text-muted-foreground">
                      テキストを生成すると、ここに結果が表示されます
                    </p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
