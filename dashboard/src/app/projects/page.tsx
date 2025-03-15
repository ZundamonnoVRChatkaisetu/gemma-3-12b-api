'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// プロジェクト/チャット履歴インターフェース
interface ChatProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ChatProject[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTab, setSelectedTab] = useState('recent')
  const router = useRouter()
  const { toast } = useToast()

  // 既存のプロジェクトを読み込む（ローカルストレージから）
  useEffect(() => {
    const savedProjects = localStorage.getItem('chatProjects')
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects))
    } else {
      // サンプルプロジェクト
      const sampleProjects: ChatProject[] = [
        {
          id: '1',
          name: '論文の要約プロジェクト',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          messageCount: 24
        },
        {
          id: '2',
          name: 'Webアプリ開発の計画',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          messageCount: 38
        },
        {
          id: '3', 
          name: '数学の問題集',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 12
        }
      ]
      setProjects(sampleProjects)
      localStorage.setItem('chatProjects', JSON.stringify(sampleProjects))
    }
  }, [])

  // 新しいプロジェクトを作成
  const createNewProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "プロジェクト名を入力してください",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // 新しいプロジェクトを作成
      const newProject: ChatProject = {
        id: Date.now().toString(),
        name: newProjectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0
      };

      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      localStorage.setItem('chatProjects', JSON.stringify(updatedProjects));
      
      setNewProjectName('');
      
      toast({
        title: "プロジェクトを作成しました",
        description: `"${newProject.name}" プロジェクトが作成されました。`,
      });

      // 新しいプロジェクトのチャットページに遷移（実際の実装では適切なルートに変更）
      router.push(`/chat/${newProject.id}`);
    } catch (error) {
      console.error("プロジェクト作成エラー:", error);
      toast({
        title: "プロジェクトの作成に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }

  // プロジェクトを削除
  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const projectToDelete = projects.find(p => p.id === id);
    if (!projectToDelete) return;
    
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('chatProjects', JSON.stringify(updatedProjects));
    
    toast({
      title: "プロジェクトを削除しました",
      description: `"${projectToDelete.name}" プロジェクトが削除されました。`,
    });
  }

  // プロジェクトをクリックしてチャットページに移動
  const navigateToProject = (id: string) => {
    router.push(`/chat/${id}`);
  }

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // プロジェクトをソート
  const sortedProjects = projects.sort((a, b) => {
    if (selectedTab === 'recent') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">プロジェクト</h1>
          <p className="text-muted-foreground">チャットの履歴とプロジェクトを管理します</p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex gap-2">
            <Input
              placeholder="新しいプロジェクト名"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-64"
            />
            <Button onClick={createNewProject} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              作成
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="recent" onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="recent">最近の更新</TabsTrigger>
          <TabsTrigger value="created">作成日</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigateToProject(project.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{project.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => deleteProject(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(project.updatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {project.messageCount} メッセージ
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    開く
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="created" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigateToProject(project.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{project.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => deleteProject(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    作成: {formatDate(project.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {project.messageCount} メッセージ
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    開く
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
