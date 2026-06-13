import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Sparkles,
  Star,
  Target,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

const team = [
  {
    name: "Анна Петрова",
    role: "Фронтенд",
    load: 45,
    skill: 5,
    match: 96,
    tone: "#2e9d8f",
  },
  {
    name: "Михаил Соколов",
    role: "Бэкенд",
    load: 62,
    skill: 5,
    match: 91,
    tone: "#b85c38",
  },
  {
    name: "Елена Морозова",
    role: "Данные",
    load: 35,
    skill: 4,
    match: 88,
    tone: "#7b61b0",
  },
  {
    name: "София Кузнецова",
    role: "Тестирование",
    load: 28,
    skill: 4,
    match: 84,
    tone: "#c99a24",
  },
];

const projects = [
  {
    name: "Спринт клиентского портала",
    target: "Выпустить аналитику",
    score: 94,
    color: "#2e9d8f",
  },
  {
    name: "Стабилизация миграции",
    target: "Снизить риски бэкенда",
    score: 89,
    color: "#b85c38",
  },
  {
    name: "Лаборатория инсайтов",
    target: "Собрать прототип ИИ-отчётности",
    score: 92,
    color: "#7b61b0",
  },
];

const stages = ["Объём", "Оценка", "Баланс", "Запуск"];

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="min-h-28 rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: tone }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#7b877f]" />
      </div>
      <p className="text-2xl font-semibold text-[#17211d]">{value}</p>
      <p className="mt-1 text-xs text-[#6f7b72]">{label}</p>
    </div>
  );
}

function Preview() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1900);

    return () => window.clearInterval(timer);
  }, []);

  const project = projects[tick % projects.length];
  const activeStage = tick % stages.length;
  const activeMember = tick % team.length;
  const averageLoad = useMemo(
    () => Math.round(team.reduce((sum, member) => sum + member.load, 0) / team.length),
    [],
  );
  const capacity = 100 - averageLoad;

  return (
    <main className="min-h-screen bg-[#f7f9f3] px-4 py-5 text-[#17211d] md:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#dfe7dc] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#163d36] text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">ИИ-оптимизатор команды</p>
              <p className="text-xs text-[#6f7b72]">Живая доска распределения</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stages.map((stage, index) => (
              <div
                key={stage}
                className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                  activeStage === index
                    ? "border-[#9fcac3] bg-[#e7f6f4] text-[#15564f]"
                    : "border-[#dfe7dc] bg-[#f8faf4] text-[#68746c]"
                }`}
              >
                {activeStage === index && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#2e9d8f]" />
                )}
                {stage}
              </div>
            ))}
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[1fr_440px]">
          <div className="grid gap-5">
            <div className="rounded-lg border border-[#dfe7dc] bg-white p-5 shadow-sm md:p-6">
              <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#d5e5de] bg-[#edf8f3] px-3 py-2 text-sm font-medium text-[#1f665b]">
                    <BrainCircuit className="h-4 w-4" />
                    Рекомендация ИИ
                  </div>
                  <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-[#111916] md:text-5xl">
                    {project.name}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#667269] md:text-base">
                    {project.target}
                  </p>
                </div>

                <div
                  className="grid h-36 w-36 shrink-0 place-items-center rounded-full p-3 transition-all duration-500"
                  style={{
                    background: `conic-gradient(${project.color} ${project.score * 3.6}deg, #e6ece2 0deg)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-white">
                    <div className="text-center">
                      <p className="text-4xl font-semibold">{project.score}</p>
                      <p className="text-xs font-medium text-[#6f7b72]">балл соответствия</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Metric icon={Users} label="рекомендованная команда" tone="#2e9d8f" value="4 человека" />
                <Metric icon={Gauge} label="средняя загрузка" tone="#b85c38" value={`${averageLoad}%`} />
                <Metric icon={Target} label="свободная ёмкость" tone="#7b61b0" value={`${capacity}%`} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-[#dfe7dc] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Покрытие ролей</p>
                    <p className="text-xs text-[#6f7b72]">навыки под спринт</p>
                  </div>
                  <BriefcaseBusiness className="h-5 w-5 text-[#7b61b0]" />
                </div>
                <div className="space-y-4">
                  {team.map((member, index) => (
                    <div key={member.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#24302a]">{member.role}</span>
                        <span className="text-[#6f7b72]">{member.match}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#edf1ea]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            backgroundColor: member.tone,
                            width: `${activeStage >= index % stages.length ? member.match : member.match - 16}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#dfe7dc] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Ритм запуска</p>
                    <p className="text-xs text-[#6f7b72]">окна поставки</p>
                  </div>
                  <CalendarDays className="h-5 w-5 text-[#b85c38]" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 21 }).map((_, index) => {
                    const active = (index + tick) % 5 !== 0;
                    return (
                      <span
                        key={index}
                        className={`h-9 rounded-md border transition duration-300 ${
                          active
                            ? "border-[#cfe3d6] bg-[#eaf7ee]"
                            : "border-[#efdfcf] bg-[#fff4df]"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[#dfe7dc] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">Выбранная команда</p>
                <p className="text-xs text-[#6f7b72]">ранжировано по соответствию и доступности</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff5d6] text-[#765d18]">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-3">
              {team.map((member, index) => {
                const active = activeMember === index;
                return (
                  <div
                    key={member.name}
                    className={`rounded-lg border p-4 transition duration-300 ${
                      active
                        ? "scale-[1.01] border-[#9fcac3] bg-[#eef9f6] shadow-sm"
                        : "border-[#e3e9df] bg-[#fbfcf8]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
                        style={{ backgroundColor: member.tone }}
                      >
                        {member.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold">{member.name}</p>
                          {active ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2e9d8f]" />
                          ) : (
                            <UserCheck className="h-4 w-4 shrink-0 text-[#8a958d]" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#6f7b72]">{member.role}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-white p-2">
                        <p className="font-semibold text-[#17211d]">{member.match}%</p>
                        <p className="text-[#6f7b72]">соответствие</p>
                      </div>
                      <div className="rounded-md bg-white p-2">
                        <p className="font-semibold text-[#17211d]">{100 - member.load}%</p>
                        <p className="text-[#6f7b72]">свободно</p>
                      </div>
                      <div className="rounded-md bg-white p-2">
                        <p className="flex items-center gap-1 font-semibold text-[#17211d]">
                          {member.skill}
                          <Star className="h-3 w-3 fill-[#c99a24] text-[#c99a24]" />
                        </p>
                        <p className="text-[#6f7b72]">навык</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export { Preview };
export default Preview;
