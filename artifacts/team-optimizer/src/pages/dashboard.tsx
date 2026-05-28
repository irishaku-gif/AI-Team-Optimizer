import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Activity, Battery, AlertTriangle, Star, ArrowRight, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Панель</h1>
          <div className="h-6 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 w-24 bg-muted rounded" /></CardHeader>
              <CardContent><div className="h-8 w-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Не удалось загрузить панель</h2>
        <p className="text-muted-foreground mb-4">Произошла ошибка при подключении к серверу.</p>
      </div>
    );
  }

  if (summary.totalEmployees === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">Добро пожаловать в ИИ-оптимизатор</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Список сотрудников пока пуст. Добавьте членов команды с их ролями, навыками и текущей загрузкой, чтобы начать собирать оптимальные команды.
        </p>
        <Link href="/employees" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2">
          Добавить первого сотрудника
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Панель</h1>
        <p className="text-muted-foreground">Обзор загрузки команды и недавних подборок.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего в команде</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Активные сотрудники</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя загрузка</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">{Math.round(summary.averageLoad)}%</div>
            </div>
            <Progress value={summary.averageLoad} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Свободная ёмкость</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summary.availableCapacity)}<span className="text-sm font-normal text-muted-foreground ml-1">баллов</span></div>
            <p className="text-xs text-muted-foreground mt-1">Общий свободный ресурс</p>
          </CardContent>
        </Card>

        <Card className={summary.overloadedCount > 0 ? "border-destructive/50 bg-destructive/5 hover-elevate" : "hover-elevate"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Перегружены</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${summary.overloadedCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.overloadedCount > 0 ? 'text-destructive' : ''}`}>
              {summary.overloadedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Загрузка {'>='} 80%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        <Card className="md:col-span-4 hover-elevate">
          <CardHeader>
            <CardTitle>Распределение по ролям</CardTitle>
            <CardDescription>Численность и средняя загрузка по ролям</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.roleBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="role" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-md)'
                    }}
                  />
                  <Bar dataKey="count" name="Сотрудники" radius={[4, 4, 0, 0]}>
                    {summary.roleBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 hover-elevate">
          <CardHeader>
            <CardTitle>Лучшие специалисты</CardTitle>
            <CardDescription>Высокий навык и свободная ёмкость</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {summary.topPerformers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Нет данных</div>
              ) : (
                summary.topPerformers.map((performer, i) => (
                  <motion.div 
                    key={performer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm mr-4">
                      {performer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none flex items-center justify-between">
                        <span>{performer.name}</span>
                        <span className="flex items-center text-amber-500 text-xs">
                          <Star className="h-3 w-3 fill-current mr-1" />
                          {performer.skill}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground flex justify-between">
                        <span>{performer.role}</span>
                        <span>загрузка {performer.load}%</span>
                      </p>
                      <Progress value={performer.load} className="h-1.5" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Недавние подборки</CardTitle>
            <CardDescription>Последние команды, собранные оптимизатором</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/history">Все подборки</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.recentRecommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Подборок пока нет. <Link href="/recommend" className="text-primary hover:underline">Соберите первую команду</Link>.
              </div>
            ) : (
              summary.recentRecommendations.map((rec) => (
                <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card text-card-foreground">
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{rec.projectName}</h4>
                      {rec.aiPowered && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary hover:bg-primary/20">
                          <Zap className="h-3 w-3 mr-1" /> Подбор ИИ
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.memberNames.map((name, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(rec.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
