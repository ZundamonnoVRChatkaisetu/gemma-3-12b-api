'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, FileText, Copy, Check, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import { MessageContent } from '../components/MessageContent'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface FileInfo {
  name: string
  path: string
  is_dir: boolean
  size?: number
  size_formatted?: string
  modified?: string
  created?: string
  mime_type?: string
  extension?: string
  icon?: string
  is_hidden?: boolean
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [isEditingFile, setIsEditingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const [showMemoryHelp, setShowMemoryHelp] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // チャット履歴を下までスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // テキストエリアの高さを内容に合わせて自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // ファイルの内容を読み込む
  async function readFile(path: string) {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/read?path=${encodeURIComponent(path)}`)
      if (!response.ok) throw new Error('ファイルの読み込みに失敗しました')
      
      const data = await response.json()
      setFileContent(data.content)
      return data.content
    } catch (error) {
      console.error('ファイルの読み込み中にエラーが発生しました:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ファイルの読み込み中にエラーが発生しました。'
      }])
      return null
    }
  }

  // ファイルに内容を書き込む
  async function writeFile(path: string, content: string, createDirs: boolean = false) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/files/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          content,
          create_dirs: createDirs
        }),
      })
      
      if (!response.ok) throw new Error('ファイルの書き込みに失敗しました')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('ファイルの書き込み中にエラーが発生しました:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ファイルの書き込み中にエラーが発生しました。'
      }])
      return null
    }
  }

  // 記憶機能のヘルプを表示/非表示
  function toggleMemoryHelp() {
    setShowMemoryHelp(prev => !prev)
  }

  // ファイル選択のハンドラー
  const handleFileSelect = async (file: FileInfo, content?: string) => {
    setSelectedFile(file)
    if (content) {
      setFileContent(content)
    }
    // ファイル操作の通知をチャットに追加
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `ファイル "${file.path}" を選択しました。`
    }])
  }

  // メッセージをコピーする
  const copyMessageToClipboard = (index: number) => {
    const message = messages[index];
    navigator.clipboard.writeText(message.content)
      .then(() => {
        setCopiedMessageIndex(index);
        setTimeout(() => setCopiedMessageIndex(null), 2000);
      })
      .catch(err => {
        console.error('メッセージのコピーに失敗しました:', err);
      });
  };

  // 全てのチャットをコピーする
  const copyAllChat = () => {
    const chatText = messages.map(msg => 
      `${msg.role === 'user' ? 'あなた' : 'Gemma 3'}: ${msg.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(chatText)
      .then(() => {
        alert('全てのチャットをコピーしました');
      })
      .catch(err => {
        console.error('チャットのコピーに失敗しました:', err);
      });
  };

  // チャット送信
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
      const response = await fetch('http://localhost:8000/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({ role: msg.role, content: msg.content })), 
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error('APIリクエストが失敗しました')
      }

      const data = await response.json()
      
      // アシスタントの応答をチャットに追加
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message.content }])
    } catch (error) {
      console.error('エラー:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'すみません、エラーが発生しました。もう一度お試しください。' },
      ])
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }

  // Enterキーで送信（Shift+Enterで改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4">
          {/* チャット */}
          <div className="flex flex-col h-[calc(100vh-150px)]">
            <div className="flex-1 overflow-auto bg-background p-4 rounded-lg shadow-sm">
              {/* 全チャットをコピーするボタン */}
              {messages.length > 0 && (
                <div className="flex justify-end mb-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={copyAllChat}
                          className="bg-gray-100 text-gray-600 hover:bg-gray-200 p-2 rounded-md flex items-center gap-1"
                        >
                          <Copy size={16} />
                          <span className="text-sm">全チャットをコピー</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>全ての会話をコピーします</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {/* メッセージがない場合は案内を表示 */}
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-semibold mb-2">Gemma 3 12Bとチャットを始めましょう</h2>
                  <p className="text-gray-600 mb-4">質問や会話を入力してください。</p>
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={toggleMemoryHelp}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <HelpCircle size={18} />
                      記憶機能のヘルプ
                    </button>
                  </div>
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
                      className={`rounded-lg px-4 py-3 max-w-[80%] relative group ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-card border border-gray-200'
                      }`}
                    >
                      {/* MessageContentコンポーネントを使用してコードブロックを検出・表示 */}
                      <MessageContent 
                        content={message.content} 
                        isUser={message.role === 'user'} 
                      />
                      
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-card border border-gray-200">
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
            
            <div className="p-2 mt-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="メッセージを入力...（Shift+Enterで改行、Enterで送信）"
                    className="flex-1 rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[200px] resize-none"
                    rows={1}
                  />
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={toggleMemoryHelp}
                          className={`${
                            showMemoryHelp 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-700'
                          } rounded-md p-2 hover:bg-gray-200 transition-colors`}
                        >
                          <HelpCircle size={20} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{showMemoryHelp ? '記憶機能のヘルプを閉じる' : '記憶機能のヘルプを開く'}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="submit"
                          disabled={isLoading || !input.trim()}
                          className="bg-blue-500 text-white rounded-md p-2 disabled:opacity-50 hover:bg-blue-600 transition-colors"
                        >
                          <Send size={20} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>送信</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* 記憶機能のヘルプ */}
                {showMemoryHelp && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-2">
                    <h3 className="text-lg font-medium text-green-800 mb-2">記憶機能の使い方</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-1">情報を記憶させる</h4>
                        <div className="bg-white rounded p-2 border border-green-100">
                          「好きな色は赤を覚えて」<br />
                          「私の誕生日は6月1日を記憶して」
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-700 mb-1">記憶した情報を取得する</h4>
                        <div className="bg-white rounded p-2 border border-green-100">
                          「好きな色を思い出して」<br />
                          「私の誕生日について教えて」
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-700 mb-1">記憶した情報を削除する</h4>
                        <div className="bg-white rounded p-2 border border-green-100">
                          「好きな色を忘れて」<br />
                          「私の誕生日を忘れて」
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-700 mb-1">記憶している情報の一覧を表示する</h4>
                        <div className="bg-white rounded p-2 border border-green-100">
                          「覚えていることを教えて」<br />
                          「記憶一覧」
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-green-700 mb-1">すべての記憶を削除する</h4>
                        <div className="bg-white rounded p-2 border border-green-100">
                          「覚えていることすべてを忘れて」<br />
                          「全ての記憶を消去して」
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">記憶は次回の会話でも引き継がれ、いつでも参照できます。</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
