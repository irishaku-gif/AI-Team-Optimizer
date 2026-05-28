import { useState } from "react";
import {
  useListEmployees,
  type ScoredEmployee,
  type TeamRecommendation,
} from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Zap, Loader2, Star, RefreshCw, Bot, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  ANY_ROLE,
  recommendSchema,
  type RecommendFormValues,
} from "@/features/team-recommendation/schema";
import { useTeamRecommendationMutation } from "@/features/team-recommendation/use-team-recommendation";

export default function Recommend() {
  const { data: employees, isLoading: employeesLoading } = useListEmployees();
  const {
    recommendMutation,
    invalidateRecommendationViews,
  } = useTeamRecommendationMutation();
  
  const [result, setResult] = useState<TeamRecommendation | null>(null);

  const form = useForm<RecommendFormValues>({
    resolver: zodResolver(recommendSchema),
    defaultValues: {
      projectName: "",
      projectDescription: "",
      requiredRole: ANY_ROLE,
      teamSize: 2,
    },
  });

  const uniqueRoles = Array.from(new Set(employees?.map(e => e.role) || []));

  const onSubmit = (data: RecommendFormValues) => {
    const payload = {
      projectName: data.projectName,
      projectDescription: data.projectDescription || undefined,
      requiredRole: data.requiredRole === ANY_ROLE ? undefined : data.requiredRole,
      teamSize: data.teamSize,
    };

    recommendMutation.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          setResult(data);
          invalidateRecommendationViews();
        }
      }
    );
  };

  const resetForm = () => {
    setResult(null);
    form.reset({ projectName: "", projectDescription: "", requiredRole: ANY_ROLE, teamSize: 2 });
  };

  if (employeesLoading) {
    return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (employees?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto px-4">
        <Users className="h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-bold mb-3">Нужны сотрудники</h2>
        <p className="text-muted-foreground mb-8">
          Чтобы подобрать команду, нужно сначала добавить сотрудников в список.
        </p>
        <Button asChild size="lg" className="w-full shadow-sm">
          <Link href="/employees">Перейти к сотрудникам</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary fill-primary/20" />
          Подбор команды
        </h1>
        <p className="text-muted-foreground mt-2">
          Позвольте ИИ найти лучшее сочетание навыков и доступности для вашего следующего проекта.
        </p>
      </div>

      {!result && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Требования к проекту</CardTitle>
            <CardDescription>Опишите задачу, и мы подберём подходящих людей.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название проекта <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="например, редизайн сайта на 3-й квартал" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание (необязательно)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Кратко опишите цели проекта. Этот контекст помогает ИИ давать более точные рекомендации." 
                          className="resize-none h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="requiredRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Специализация</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Любая роль" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ANY_ROLE}>Любая роль (смешанная команда)</SelectItem>
                            {uniqueRoles.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>При необходимости отфильтруйте кандидатов по конкретной роли.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                          <span>Размер команды</span>
                          <span className="font-bold text-primary">{field.value} чел.</span>
                        </FormLabel>
                        <FormControl>
                          <Slider 
                            min={1} 
                            max={Math.min(20, employees?.length || 20)} 
                            step={1} 
                            value={[field.value]} 
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-3"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={recommendMutation.isPending}
                    className="w-full sm:w-auto shadow-md"
                  >
                    {recommendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Анализируем команду...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Подобрать команду
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-6 rounded-xl border">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">Команда для «{result.projectName}»</h2>
                {result.aiPowered ? (
                  <Badge variant="default" className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20">
                    <Bot className="h-3.5 w-3.5 mr-1" /> Подбор ИИ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Локальный подбор</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Выбрано участников: {result.team.length}</p>
            </div>
            <Button onClick={resetForm} variant="outline" className="shrink-0 bg-background">
              <RefreshCw className="mr-2 h-4 w-4" /> Подобрать ещё
            </Button>
          </div>

          {result.explanation && (
            <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-background p-2 rounded-full shadow-sm shrink-0 h-10 w-10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-3 flex-1 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                    {result.explanation}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {result.team.map((scored: ScoredEmployee, index: number) => (
              <motion.div
                key={scored.employee.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (index * 0.1), duration: 0.3 }}
              >
                <Card className="h-full hover-elevate overflow-hidden border">
                  <div className="absolute top-0 right-0 p-3 flex flex-col items-end">
                    <div className="text-3xl font-bold tracking-tighter text-primary/20 leading-none">
                      {Math.round(scored.score)}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Балл</div>
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1 pr-12">{scored.employee.name}</h3>
                    <Badge variant="secondary" className="mb-4">{scored.employee.role}</Badge>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Навык</span>
                        <span className="flex items-center text-amber-500 font-medium">
                          {scored.employee.skill} <Star className="h-3.5 w-3.5 fill-current ml-1" />
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Доступность</span>
                          <span className="font-medium text-emerald-600">{Math.round(scored.availability)}% свободно</span>
                        </div>
                        <Progress value={scored.availability} className="h-2 [&>div]:bg-emerald-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
