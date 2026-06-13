import { useListRecommendations } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, History as HistoryIcon, Users, Bot, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { data: history, isLoading, error } = useListRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">История подборок</h1>
          <div className="h-6 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-24">
                <div className="h-5 w-48 bg-muted rounded mb-4" />
                <div className="h-3 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Не удалось загрузить историю</h2>
        <p className="text-muted-foreground">Произошла ошибка при подключении к серверу.</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <HistoryIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">История пока пуста</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Вы ещё не собирали команды через оптимизатор. Перейдите на страницу подбора, чтобы получить первую рекомендацию.
        </p>
        <Link href="/recommend" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2">
          Подобрать команду
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-primary fill-primary/10" />
          История подборок
        </h1>
        <p className="text-muted-foreground mt-2">
          Просматривайте команды, которые вы собирали через оптимизатор.
        </p>
      </div>

      <div className="space-y-4">
        {history.map((rec) => (
          <Card key={rec.id} className="overflow-hidden hover-elevate transition-all duration-200">
            <CardHeader className="pb-4 pt-6 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{rec.projectName}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <span className="font-medium mr-2">{format(new Date(rec.createdAt), 'PPP', { locale: ru })}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {rec.teamSize} чел.
                    </span>
                  </CardDescription>
                </div>
                <div>
                  {rec.aiPowered ? (
                    <Badge variant="default" className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20">
                      <Bot className="h-3.5 w-3.5 mr-1" /> Подбор ИИ
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Локальный подбор</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Состав команды</h4>
                <div className="flex flex-wrap gap-2">
                  {rec.memberNames.map((name, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-medium bg-secondary/50 hover:bg-secondary border-transparent">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>

              <Collapsible className="group">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full flex items-center justify-between p-4 h-auto border border-dashed rounded-lg text-muted-foreground hover:text-foreground">
                    <span className="flex items-center font-medium">
                      <Bot className="h-4 w-4 mr-2" /> Показать обоснование
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 pb-2">
                  <div className="bg-primary/5 rounded-lg p-5 border border-primary/10 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-lg" />
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium">
                      {rec.explanation}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
