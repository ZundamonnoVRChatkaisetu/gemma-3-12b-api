'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, FileText, FolderOpen, Save, Trash, FileUp } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface FileInfo {
  name: string
  path: string
  is_dir: boolean
  size?: number
  modified?: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [showFileManager, setShowFileManager] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [isEditingFile, setIsEditingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // チャット履歴を下までスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ファイル一覧を取得
  async function fetchFiles(path: string = '') {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/list?path=${encodeURIComponent(path)}`)
      if (!response.ok) throw new Error('ファイル一覧の取得に失敗しました')
      
      const data = await response.json()
      setFiles(data.files)
      setCurrentPath(data.current_dir)
    } catch (error) {
      console.error('ファイル一覧の取得中にエラーが発生しました:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ファイル一覧の取得中にエラーが発生しました。'
      }])
    }
  }

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

  // ディレクトリを作成
  async function createDirectory(path: string, existOk: boolean = false) {
    try {
      const response = await fetch('http://localhost:8000/api/v1/files/mkdir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          exist_ok: existOk
        }),
      })
      
      if (!response.ok) throw new Error('ディレクトリの作成に失敗しました')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('ディレクトリの作成中にエラーが発生しました:', error)
      return null
    }
  }

  // ファイルを削除
  async function deleteFile(path: string) {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/files/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('ファイルの削除に失敗しました')
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('ファイルの削除中にエラーが発生しました:', error)
      return null
    }
  }

  // ファイルマネージャーを開く
  function handleOpenFileManager() {
    setShowFileManager(true)
    fetchFiles()
  }

  // ファイルをクリック
  async function handleFileClick(file: FileInfo) {
    if (file.is_dir) {
      // ディレクトリの場合は中に入る
      fetchFiles(file.path)
    } else {
      // ファイルの場合は選択状態にする
      setSelectedFile(file)
      const content = await readFile(file.path)
      if (content !== null) {
        setFileContent(content)
      }
    }
  }

  // 親ディレクトリに移動
  function handleGoParent() {
    const parentPath = currentPath.split('/').slice(0, -1).join('/')
    fetchFiles(parentPath)
  }

  // ファイル編集を開始
  function handleEditFile() {
    if (selectedFile) {
      setIsEditingFile(true)
    }
  }

  // ファイルを保存
  async function handleSaveFile() {
    if (selectedFile) {
      const result = await writeFile(selectedFile.path, fileContent)
      if (result) {
        setIsEditingFile(false)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `ファイル "${selectedFile.path}" を保存しました。`
        }])
      }
    }
  }

  // ファイルを削除
  async function handleDeleteFile() {
    if (selectedFile) {
      const result = await deleteFile(selectedFile.path)
      if (result) {
        setSelectedFile(null)
        setFileContent('')
        fetchFiles(currentPath)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `ファイル "${selectedFile.path}" を削除しました。`
        }])
      }
    }
  }

  // 新しいファイルを作成
  async function handleCreateNewFile() {
    const fileName = prompt('新しいファイル名を入力してください:')
    if (fileName) {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName
      const result = await writeFile(filePath, '', true)
      if (result) {
        fetchFiles(currentPath)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `新しいファイル "${filePath}" を作成しました。`
        }])
      }
    }
  }

  // 新しいディレクトリを作成
  async function handleCreateNewDirectory() {
    const dirName = prompt('新しいディレクトリ名を入力してください:')
    if (dirName) {
      const dirPath = currentPath ? `${currentPath}/${dirName}` : dirName
      const result = await createDirectory(dirPath, false)
      if (result) {
        fetchFiles(currentPath)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `新しいディレクトリ "${dirPath}" を作成しました。`
        }])
      }
    }
  }

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

      // ファイル操作の指示を検出して実行（より高度な実装ではパース処理を入れる）
      const lowerCaseMsg = userMessage.toLowerCase()
      if (lowerCaseMsg.includes('ファイル一覧') || lowerCaseMsg.includes('ディレクトリ一覧')) {
        handleOpenFileManager()
      }
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

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Gemma 3 チャットインターフェース</h1>
      </header>
      
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ファイルマネージャー */}
          {showFileManager && (
            <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-150px)]">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">ファイルマネージャー</h2>
                <div className="flex gap-1">
                  <button 
                    onClick={handleCreateNewFile}
                    className="p-1 text-gray-500 hover:text-blue-500"
                    title="新規ファイル"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={handleCreateNewDirectory}
                    className="p-1 text-gray-500 hover:text-blue-500"
                    title="新規ディレクトリ"
                  >
                    <FolderOpen size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <span className="truncate flex-1">{currentPath || '/'}</span>
                {currentPath && (
                  <button 
                    onClick={handleGoParent}
                    className="p-1 text-gray-500 hover:text-blue-500 ml-2"
                    title="親ディレクトリへ"
                  >
                    上へ
                  </button>
                )}
              </div>
              
              <div className="overflow-auto flex-1 border rounded">
                <div className="divide-y">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                        selectedFile?.path === file.path ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleFileClick(file)}
                    >
                      {file.is_dir ? (
                        <FolderOpen size={16} className="text-yellow-500 mr-2" />
                      ) : (
                        <FileText size={16} className="text-gray-500 mr-2" />
                      )}
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <div className="p-2 text-gray-500 text-center">
                      ファイルがありません
                    </div>
                  )}
                </div>
              </div>
              
              {selectedFile && !selectedFile.is_dir && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleEditFile}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm flex-1"
                  >
                    編集
                  </button>
                  <button
                    onClick={handleDeleteFile}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm flex-1"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          )}

          {/* エディタ */}
          {selectedFile && !selectedFile.is_dir && (
            <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-150px)]">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold truncate">{selectedFile.name}</h2>
                {isEditingFile && (
                  <button 
                    onClick={handleSaveFile}
                    className="p-1 text-gray-500 hover:text-green-500"
                    title="保存"
                  >
                    <Save size={18} />
                  </button>
                )}
              </div>
              
              <textarea
                className="flex-1 border rounded p-2 w-full font-mono text-sm resize-none"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                readOnly={!isEditingFile}
              />
            </div>
          )}

          {/* チャット */}
          <div className={`${
            showFileManager || (selectedFile && !selectedFile.is_dir) 
              ? 'md:col-span-1' 
              : 'md:col-span-3'
          } flex flex-col h-[calc(100vh-150px)]`}>
            <div className="flex-1 overflow-auto bg-white p-4 rounded-lg shadow-md">
              {/* メッセージがない場合は案内を表示 */}
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <h2 className="text-2xl font-semibold mb-2">Gemma 3 12Bとチャットを始めましょう</h2>
                  <p className="text-gray-600 mb-4">質問や会話を入力してください。</p>
                  <button 
                    onClick={handleOpenFileManager}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium"
                  >
                    ファイルマネージャーを開く
                  </button>
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
            
            <div className="p-2 mt-2">
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
                  type="button"
                  onClick={handleOpenFileManager}
                  className="bg-gray-100 text-gray-700 rounded-md p-2 hover:bg-gray-200"
                  title="ファイルマネージャーを開く"
                >
                  <FolderOpen size={20} />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 text-white rounded-md p-2 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
