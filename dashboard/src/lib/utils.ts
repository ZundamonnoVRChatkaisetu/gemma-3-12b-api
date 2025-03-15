import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * クラス名を結合するユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて、Tailwindのクラスをよりスマートにマージするためのものです
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 指定したミリ秒だけ処理を遅延させる
 * 非同期処理で待機が必要な場合に使用する
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 文字列を指定した長さに切り詰め、省略記号を付ける
 * ファイル名などの表示に便利
 */
export function truncateString(str: string, length = 20): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * 指定されたタイムスタンプをフォーマットして表示する
 * 日付表示に使用
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 * バイト数を KB, MB, GB などの単位に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * クリップボードにテキストをコピーする関数
 * 成功または失敗のステータスを返す
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err)
    return false
  }
}
