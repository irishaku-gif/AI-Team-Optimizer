import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Component,
  Gauge,
  Layers,
  MonitorPlay,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { modules as discoveredModules } from "./.generated/mockup-components";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

interface PreviewEntry {
  componentPath: string;
  key: string;
  name: string;
  route: string;
}

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function toRoute(componentPath: string): string {
  const basePath = getBasePath();
  return `${basePath}/preview/${componentPath}`;
}

function getPreviewEntries(modules: ModuleMap): PreviewEntry[] {
  return Object.keys(modules)
    .sort()
    .map((key) => {
      const componentPath = key
        .replace(/^\.\/components\/mockups\//, "")
        .replace(/\.tsx$/, "");
      const name = componentPath.split("/").pop() ?? componentPath;

      return {
        componentPath,
        key,
        name,
        route: toRoute(componentPath),
      };
    });
}

function getPreviewExamplePath(entries: PreviewEntry[]): string {
  return entries[0]?.route ?? toRoute("ComponentName");
}

function formatMockupCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} макет`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} макета`;
  }
  return `${count} макетов`;
}

function LoadingPreview({ componentPath }: { componentPath: string }) {
  return (
    <div className="min-h-screen bg-[#f8faf6] text-[#18221d]">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-lg border border-[#dfe7dc] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#163d36] text-white">
              <MonitorPlay className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold">Загрузка превью</p>
              <p className="text-xs text-[#6a756d]">{componentPath}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[82, 64, 92].map((width, index) => (
              <div key={index} className="h-2 rounded-full bg-[#edf1ea]">
                <div
                  className="h-full animate-pulse rounded-full bg-[#2e9d8f]"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewError({
  error,
  entries,
}: {
  entries: PreviewEntry[];
  error: string;
}) {
  return (
    <main className="min-h-screen bg-[#fff8f4] p-6 text-[#241916]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center">
        <section className="w-full rounded-lg border border-[#efcfc4] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#b4432f] text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Превью ожидает</h1>
              <p className="mt-1 text-sm text-[#745c55]">
                Маршрут компонента найден, но модуль не удалось загрузить.
              </p>
            </div>
          </div>

          <pre className="mb-5 overflow-x-auto rounded-md bg-[#2d1f1b] p-4 text-sm leading-relaxed text-[#ffe7de]">
            {error}
          </pre>

          {entries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-[#745c55]">
                Доступные превью
              </p>
              <div className="flex flex-wrap gap-2">
                {entries.map((entry) => (
                  <a
                    key={entry.key}
                    className="inline-flex items-center gap-2 rounded-md border border-[#efcfc4] px-3 py-2 text-sm font-medium transition hover:bg-[#fff1ea]"
                    href={entry.route}
                  >
                    {entry.name}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [ComponentToRender, setComponentToRender] =
    useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entries = useMemo(() => getPreviewEntries(modules), [modules]);

  useEffect(() => {
    let cancelled = false;

    setComponentToRender(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        if (!cancelled) {
          setError(`Компонент не найден: ${componentPath}.tsx`);
        }
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `В ${componentPath}.tsx не найден экспортированный React-компонент.\n\nУбедитесь, что в файле есть хотя бы один экспортированный функциональный компонент.`,
          );
          return;
        }
        setComponentToRender(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Не удалось загрузить превью.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return <PreviewError entries={entries} error={error} />;
  }

  if (!ComponentToRender) {
    return <LoadingPreview componentPath={componentPath} />;
  }

  return <ComponentToRender />;
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "amber" | "green" | "teal";
}) {
  const toneClass = {
    amber: "border-[#f3d78b] bg-[#fff5d6] text-[#765d18]",
    green: "border-[#b7dec3] bg-[#ecf9ee] text-[#245f35]",
    teal: "border-[#b9dedc] bg-[#e9f8f7] text-[#185f59]",
  }[tone];

  return (
    <div
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

function PreviewTile({ entry, index }: { entry: PreviewEntry; index: number }) {
  const accents = ["#2e9d8f", "#b85c38", "#7b61b0"];

  return (
    <a
      className="group block rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#a9c9c1] hover:shadow-md"
      href={entry.route}
      style={{ animation: `tile-in 420ms ease-out ${index * 80}ms both` }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f0f4ed] text-[#233029]">
          <Component className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-[#7d887f] transition group-hover:translate-x-1 group-hover:text-[#233029]" />
      </div>
      <p className="font-semibold text-[#19231e]">{entry.name}</p>
      <p className="mt-1 text-xs text-[#6f7b72]">{entry.componentPath}.tsx</p>
      <div className="mt-4 flex gap-1">
        {[54, 78, 36].map((height, barIndex) => (
          <span
            key={barIndex}
            className="block w-6 rounded-t-sm"
            style={{
              backgroundColor: accents[barIndex],
              height: `${height / 4}px`,
              opacity: barIndex === index % 3 ? 1 : 0.45,
            }}
          />
        ))}
      </div>
    </a>
  );
}

function Gallery() {
  const entries = useMemo(
    () => getPreviewEntries(discoveredModules),
    [],
  );
  const examplePath = getPreviewExamplePath(entries);
  const activeCount = entries.length;
  const fallbackEntry: PreviewEntry = {
    componentPath: "ComponentName",
    key: "ComponentName",
    name: "Компонент",
    route: toRoute("ComponentName"),
  };
  const visibleEntries = activeCount > 0 ? entries : [fallbackEntry];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faf4] text-[#17211d]">
      <style>{`
        @keyframes tile-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-5 py-6 md:grid-cols-[1fr_420px] md:px-8 lg:px-10">
        <section className="flex min-h-[70vh] flex-col justify-center py-10">
          <div className="mb-6 flex flex-wrap gap-2">
            <StatusPill icon={CheckCircle2} label="Сервер превью готов" tone="green" />
            <StatusPill icon={RefreshCw} label="Горячая перезагрузка активна" tone="teal" />
            <StatusPill icon={Clock3} label={formatMockupCount(activeCount)} tone="amber" />
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-[#111916] md:text-6xl">
            Сервер предпросмотра компонентов
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#5d6a61] md:text-lg">
            Живой холст для отрисовки компонентов-макетов из рабочей области.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#163d36] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#21584f]"
              href={examplePath}
            >
              Открыть живое превью
              <MonitorPlay className="h-4 w-4" />
            </a>
            <code className="inline-flex min-h-11 items-center rounded-md border border-[#d8e2d6] bg-white px-4 py-3 text-sm text-[#4f5c53]">
              {examplePath}
            </code>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm">
              <Gauge className="mb-3 h-5 w-5 text-[#2e9d8f]" />
              <p className="text-2xl font-semibold">24 мс</p>
              <p className="text-xs text-[#6f7b72]">последнее обновление</p>
            </div>
            <div className="rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm">
              <Layers className="mb-3 h-5 w-5 text-[#b85c38]" />
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-xs text-[#6f7b72]">зарегистрированные маршруты</p>
            </div>
            <div className="rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm">
              <Sparkles className="mb-3 h-5 w-5 text-[#7b61b0]" />
              <p className="text-2xl font-semibold">онлайн</p>
              <p className="text-xs text-[#6f7b72]">режим отрисовки</p>
            </div>
          </div>
        </section>

        <aside className="flex items-center py-6">
          <div className="w-full rounded-lg border border-[#dfe7dc] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Макеты</p>
                <p className="text-xs text-[#6f7b72]">src/components/mockups</p>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2e9d8f] opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#2e9d8f]" />
              </span>
            </div>

            <div className="grid gap-3">
              {visibleEntries.map((entry, index) => (
                <PreviewTile entry={entry} index={index} key={entry.key} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  return <Gallery />;
}

export default App;
