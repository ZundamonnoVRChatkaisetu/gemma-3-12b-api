"use client";

import React, { useState, useRef, useCallback } from 'react';
import { FileUp, Trash2, RefreshCw, Search, Download, Copy, Check, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

/**
 * データ分析ツールページ
 * テキストデータや表形式データの分析とインサイト抽出
 */
export default function DataAnalysisPage() {
  const { toast } = useToast();
  const [dataText, setDataText] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<string>('summary');
  const [fileType, setFileType] = useState<string>('text');
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzed, setAnalyzed] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分析タイプの選択肢
  const analysisTypes = [
    { value: 'summary', label: 'テキスト要約', description: 'テキストデータの主要ポイントを抽出' },
    { value: 'sentiment', label: '感情分析', description: '文章の感情傾向（ポジティブ/ネガティブ）を分析' },
    { value: 'topics', label: 'トピック抽出', description: 'テキスト内の主要トピックを特定' },
    { value: 'keywords', label: 'キーワード抽出', description: '重要なキーワードを抽出してランク付け' },
    { value: 'statistics', label: '数値データ分析', description: '数値データの統計分析（CSV/表形式）' }
  ];

  // ファイル読み込み処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    // ファイルタイプを判断
    if (file.name.endsWith('.csv')) {
      setFileType('csv');
    } else if (file.name.endsWith('.json')) {
      setFileType('json');
    } else {
      setFileType('text');
    }
    
    // ファイル読み込み
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDataText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // データ削除
  const clearData = () => {
    setDataText('');
    setFileType('text');
    setFileName('');
    setResult('');
    setAnalyzed(false);
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "データをクリアしました",
      description: "新しいデータを入力または読み込んでください",
    });
  };

  // データ分析の実行
  const analyzeData = async () => {
    if (!dataText.trim()) {
      toast({
        title: "データが入力されていません",
        description: "分析するデータを入力またはファイルからアップロードしてください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // システムプロンプトの構築
      let systemPrompt = `あなたはデータ分析の専門家です。`;
      
      // 分析タイプに応じたプロンプト設定
      switch (analysisType) {
        case 'summary':
          systemPrompt += '入力されたテキストの要約を作成してください。主要なポイント、結論、重要な情報を抽出して構造化された形式で提示してください。';
          break;
        case 'sentiment':
          systemPrompt += '入力されたテキストの感情分析を行ってください。ポジティブ/ネガティブな表現、感情の強さ、主観性/客観性などを分析し、詳細な評価を提供してください。';
          break;
        case 'topics':
          systemPrompt += '入力されたテキストから主要なトピックを抽出してください。トピックごとに関連する文や表現を引用し、トピック間の関連性も示してください。';
          break;
        case 'keywords':
          systemPrompt += '入力されたテキストから重要なキーワードを抽出し、その重要度によってランク付けしてください。各キーワードの文脈や出現頻度も示してください。';
          break;
        case 'statistics':
          systemPrompt += '入力された数値データやCSVデータを分析し、統計情報（平均、中央値、分散、最大/最小値など）、相関関係、傾向などを詳細に説明してください。可能であれば、グラフやチャートで表現するための説明も含めてください。';
          break;
      }
      
      // ファイルタイプに関する追加情報
      if (fileType === 'csv') {
        systemPrompt += '\n\n入力データはCSV形式です。適切にカラムを特定し、データ構造を分析してください。';
      } else if (fileType === 'json') {
        systemPrompt += '\n\n入力データはJSON形式です。データ構造を解析し、オブジェクトやリストの関係性を分析してください。';
      }
      
      // 分析結果のフォーマット指定
      systemPrompt += `\n\n分析結果は以下の形式でマークダウン形式で提供してください：

## 分析概要
（全体的な分析結果の要約）

## 詳細分析
（各セクションや要素ごとの詳細な分析）

## インサイトと推奨事項
（データから得られた洞察と推奨される次のステップ）`;

      // APIリクエスト
      const response = await fetch('http://localhost:8000/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: dataText }
          ],
          temperature: 0.3, // 分析には低めの温度設定
          max_tokens: 2048
        }),
      });
      
      if (!response.ok) {
        throw new Error('データ分析に失敗しました');
      }
      
      const data = await response.json();
      setResult(data.message.content);
      setAnalyzed(true);
      
    } catch (error) {
      console.error('分析エラー:', error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "データ分析中に問題が発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 結果をコピー
  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    
    toast({
      title: "コピーしました",
      description: "分析結果がクリップボードにコピーされました",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  // 分析結果をダウンロード
  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "ダウンロードしました",
      description: "分析結果をファイルとして保存しました",
    });
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">データ分析ツール</h1>
        <p className="text-muted-foreground mt-2">
          テキストデータや構造化データからインサイトを抽出します
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-5">
        {/* コントロールパネル */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>分析設定</CardTitle>
            <CardDescription>
              データ形式と分析方法を選択
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ファイルアップロード */}
            <div className="space-y-2">
              <Label>データファイル</Label>
              <div className="flex flex-col space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    ファイルを選択
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearData}
                    disabled={!dataText}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {fileName && (
                  <div className="flex items-center mt-2">
                    <Badge variant="outline">{fileName}</Badge>
                    <Badge className="ml-2">{fileType.toUpperCase()}</Badge>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* 分析タイプ選択 */}
            <div className="space-y-2">
              <Label htmlFor="analysis-type">分析タイプ</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger id="analysis-type">
                  <SelectValue placeholder="分析タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {analysisTypes.find(t => t.value === analysisType)?.description}
              </p>
            </div>
            
            {/* アクションボタン */}
            <Button
              onClick={analyzeData}
              className="w-full"
              disabled={loading || !dataText.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                  分析中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  データを分析
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* データ表示と結果パネル */}
        <Card className="md:col-span-3">
          <Tabs defaultValue="input">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>データと分析結果</CardTitle>
                <TabsList>
                  <TabsTrigger value="input">入力データ</TabsTrigger>
                  <TabsTrigger value="result" disabled={!analyzed}>
                    分析結果
                    {analyzed && <Badge className="ml-2 bg-green-500">完了</Badge>}
                  </TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                データを入力または貼り付けてください
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="input" className="mt-0">
                <Textarea
                  value={dataText}
                  onChange={(e) => setDataText(e.target.value)}
                  placeholder="ここにテキスト、CSV、JSONデータを入力してください..."
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {fileType === 'csv' && 'CSVデータは列ごとに分析されます'}
                    {fileType === 'json' && 'JSONデータは構造を保持して分析されます'}
                    {fileType === 'text' && 'テキストデータの内容を分析します'}
                  </span>
                  <Badge variant="outline">
                    {dataText.length} 文字
                  </Badge>
                </div>
              </TabsContent>
              
              <TabsContent value="result" className="mt-0">
                {result ? (
                  <div className="relative">
                    <div className="bg-muted/50 rounded-md p-4 min-h-[400px] text-sm overflow-auto whitespace-pre-wrap markdown prose prose-sm max-w-none">
                      {result}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyResult}
                        title="結果をコピー"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={downloadResult}
                        title="結果をダウンロード"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted/50 rounded-md">
                    <BarChart className="h-16 w-16 text-muted mb-4" />
                    <p className="text-muted-foreground">
                      データを分析すると、ここに結果が表示されます
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
