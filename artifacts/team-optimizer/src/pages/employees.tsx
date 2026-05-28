import { useState } from "react";
import { useListEmployees, type Employee } from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
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
import { Search, Plus, Edit2, Trash2, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  employeeSchema,
  PRESET_ROLES,
  type EmployeeFormValues,
} from "@/features/employees/schema";
import { useEmployeeMutations } from "@/features/employees/use-employee-mutations";

export default function Employees() {
  const { data: employees, isLoading } = useListEmployees();
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    invalidateEmployeeViews,
  } = useEmployeeMutations();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      role: "",
      load: 0,
      skill: 3,
    },
  });

  const uniqueRoles = Array.from(new Set(employees?.map(e => e.role) || []));

  const filteredEmployees = employees?.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenNew = () => {
    setEditingId(null);
    form.reset({ name: "", role: "", load: 0, skill: 3 });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setEditingId(employee.id);
    form.reset({
      name: employee.name,
      role: employee.role,
      load: employee.load,
      skill: employee.skill,
    });
    setIsFormOpen(true);
  };

  const onSubmit = (data: EmployeeFormValues) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        {
          onSuccess: () => {
            toast.success("Сотрудник обновлён");
            invalidateEmployeeViews();
            setIsFormOpen(false);
          },
          onError: () => toast.error("Не удалось обновить сотрудника")
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            toast.success("Сотрудник добавлен");
            invalidateEmployeeViews();
            setIsFormOpen(false);
          },
          onError: () => toast.error("Не удалось добавить сотрудника")
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast.success("Сотрудник удалён из команды");
          invalidateEmployeeViews();
          setDeleteId(null);
        },
        onError: () => toast.error("Не удалось удалить сотрудника")
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Сотрудники</h1>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse h-40">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="h-2 w-full bg-muted rounded mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Сотрудники</h1>
          <p className="text-muted-foreground">Управляйте составом команды, ролями и текущей загрузкой.</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Обновите данные участника команды.' : 'Добавьте нового участника в команду.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Полное имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Иван Иванов" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="например, Фронтенд" 
                            {...field} 
                            list="roles-list"
                          />
                          <datalist id="roles-list">
                            {PRESET_ROLES.map(role => (
                              <option key={role} value={role} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Уровень навыка ({field.value}/5)</FormLabel>
                      <FormControl>
                        <Slider 
                          min={1} 
                          max={5} 
                          step={1} 
                          value={[field.value]} 
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>Начинающий</span>
                        <span>Эксперт</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="load"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текущая загрузка ({field.value}%)</FormLabel>
                      <FormControl>
                        <Slider 
                          min={0} 
                          max={100} 
                          step={5} 
                          value={[field.value]} 
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground px-1">
                        <span>Свободен</span>
                        <span>Полная загрузка</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Сохранить' : 'Добавить в команду'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {employees?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-dashed bg-muted/20">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Список сотрудников пуст</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Добавьте членов команды, чтобы управлять загрузкой и собирать оптимальные команды для проектов.
          </p>
          <Button onClick={handleOpenNew} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Добавить первого сотрудника
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или роли..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Фильтр по роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredEmployees?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Никто не подходит под условия поиска.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredEmployees?.map((employee) => (
                  <motion.div
                    key={employee.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover-elevate overflow-hidden border">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-base truncate pr-2" title={employee.name}>
                              {employee.name}
                            </h3>
                            <Badge variant="secondary" className="mt-1 font-normal bg-secondary/50">
                              {employee.role}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(employee)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(employee.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground font-medium">Уровень навыка</span>
                              <span className="flex items-center text-amber-500 font-medium">
                                {employee.skill} <Star className="h-3 w-3 fill-current ml-0.5" />
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <div 
                                  key={star} 
                                  className={`h-1.5 flex-1 rounded-full ${star <= employee.skill ? 'bg-amber-400' : 'bg-muted'}`}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground font-medium">Текущая загрузка</span>
                              <span className={`font-medium ${employee.load >= 80 ? 'text-destructive' : 'text-foreground'}`}>
                                {employee.load}%
                              </span>
                            </div>
                            <Progress 
                              value={employee.load} 
                              className={`h-1.5 ${employee.load >= 80 ? '[&>div]:bg-destructive' : ''}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Сотрудник будет полностью удалён из вашей команды.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить сотрудника'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
