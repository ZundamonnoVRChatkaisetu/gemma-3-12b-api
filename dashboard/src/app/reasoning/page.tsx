import { ReasoningDashboard } from "@/components/Reasoning/ReasoningDashboard";

export const metadata = {
  title: "推論ツール - Gemma 3 カスタムチャットインターフェース",
  description: "推論によって複雑な問題を解決したり、選択肢を比較したりするツール",
};

export default function ReasoningPage() {
  return <ReasoningDashboard />;
}
