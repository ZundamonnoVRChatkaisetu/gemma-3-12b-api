'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // チャット履歴を下までスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // ユーザーメッセージをチャットに追加
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      // APIエンドポイントにリクエスト
      const response = await fetch('http://localhost:8000/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formatPrompt(messages, userMessage),
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error('APIリクエストが失敗しました')
      }

      const data = await response.json()
      
      // アシスタントの応答をチャットに追加
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }])
    } catch (error) {
      console.error('エラー:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'すみません、エラーが発生しました。もう一度お試しください。' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // チャット履歴を含めたプロンプトの作成
  function formatPrompt(messageHistory: Message[], currentMessage: string): string {
    // チャット履歴から会話形式のプロンプトを生成
    let prompt = 'あなたは役立つAIアシスタントです。以下の会話を元に最新の質問に回答してください。\n\n'
    
    // 直近の数メッセージだけ含める（コンテキストウィンドウの制限を考慮）
    const recentMessages = messageHistory.slice(-6)
    
    for (const message of recentMessages) {
      if (message.role === 'user') {
        prompt += `ユーザー: ${message.content}\n`
      } else {
        prompt += `アシスタント: ${message.content}\n`
      }
    }
    
    // 現在のメッセージを追加
    prompt += `ユーザー: ${currentMessage}\nアシスタント: `
    
    return prompt
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Gemma 3 チャットインターフェース</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          {/* メッセージがない場合は案内を表示 */}
          {messages.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-2">Gemma 3 12Bとチャットを始めましょう</h2>
              <p className="text-gray-600">質問や会話を入力してください。</p>
            </div>
          )}
          
          {/* メッセージ一覧 */}
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-white border border-gray-200">
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
            {/* 自動スクロール用の参照ポイント */}
            <div ref={messagesEndRef}></div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="メッセージを入力..."
              className="flex-1 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white rounded-md p-2 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </footer>
    </div>
  )
}
