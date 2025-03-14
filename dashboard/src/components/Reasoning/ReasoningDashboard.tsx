"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepByStepReasoning } from "./StepByStepReasoning";
import { StatementEvaluator } from "./StatementEvaluator";
import { OptionsComparison } from "./OptionsComparison";
import { Brain, CheckSquare, ListChecks } from "lucide-react";

export function ReasoningDashboard() {
  const [activeTab, setActiveTab] = useState("step-by-step");

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">推論ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          複雑な問題の分析、文の評価、選択肢の比較などの推論ツール
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger
            value="step-by-step"
            className="flex items-center py-3"
            onClick={() => setActiveTab("step-by-step")}
          >
            <Brain className="h-4 w-4 mr-2" />
            <span>ステップバイステップ思考</span>
          </TabsTrigger>
          <TabsTrigger
            value="evaluate-statement"
            className="flex items-center py-3"
            onClick={() => setActiveTab("evaluate-statement")}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            <span>文の真偽評価</span>
          </TabsTrigger>
          <TabsTrigger
            value="compare-options"
            className="flex items-center py-3"
            onClick={() => setActiveTab("compare-options")}
          >
            <ListChecks className="h-4 w-4 mr-2" />
            <span>選択肢の比較</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="step-by-step" className="py-4">
          <StepByStepReasoning />
        </TabsContent>

        <TabsContent value="evaluate-statement" className="py-4">
          <StatementEvaluator />
        </TabsContent>

        <TabsContent value="compare-options" className="py-4">
          <OptionsComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
