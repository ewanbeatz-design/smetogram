import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { WorkspaceModules, type Module } from "./components/WorkspaceModules";
import { trpc } from "./lib/trpc";
import { startLogin } from "./const";
import { useAuth } from "./_core/hooks/useAuth";
import "./index.css";

type Status = "В работе" | "На согласовании" | "Завершён";

type EstimateItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  normative?: string;
  labor?: number;
  kind?: "work" | "material" | "machine";
};

type EstimateGroup = {
  id: string;
  name: string;
  items: EstimateItem[];
};

type Project = {
  id: string;
  name: string;
  city: string;
  client: string;
  type: string;
  status: Status;
  deadline: string;
  area?: number;
  region?: string;
  method?: string;
  estimate: EstimateGroup[];
};

type Notification = {
  id: string;
  title: string;
  text: string;
  time: string;
  type: "project" | "estimate" | "system" | "deadline";
  read: boolean;
};

const money = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const makeId = () => Math.random().toString(36).slice(2, 9);

const initialProjects: Project[] = [
  {
    id: "flat-krylatskoe",
    name: "Квартира на Крылатском",
    city: "Москва",
    client: "Анна Петрова",
    type: "Капитальный ремонт",
    status: "В работе",
    deadline: "20 ноя 2026",
    estimate: [
      {
        id: "demolition",
        name: "Демонтаж",
        items: [
          {
            id: "d1",
            name: "Демонтаж перегородок",
            qty: 18,
            unit: "м²",
            price: 650,
          },
          {
            id: "d2",
            name: "Снятие старого покрытия",
            qty: 54,
            unit: "м²",
            price: 180,
          },
        ],
      },
      {
        id: "walls",
        name: "Стены и потолки",
        items: [
          {
            id: "w1",
            name: "Штукатурка стен по маякам",
            qty: 86,
            unit: "м²",
            price: 920,
          },
          {
            id: "w2",
            name: "Финишная шпаклёвка",
            qty: 86,
            unit: "м²",
            price: 640,
          },
          {
            id: "w3",
            name: "Покраска стен",
            qty: 86,
            unit: "м²",
            price: 520,
          },
        ],
      },
      {
        id: "electric",
        name: "Электрика",
        items: [
          {
            id: "e1",
            name: "Монтаж розетки",
            qty: 32,
            unit: "шт",
            price: 480,
          },
          {
            id: "e2",
            name: "Прокладка кабеля",
            qty: 124,
            unit: "м.п.",
            price: 190,
          },
        ],
      },
    ],
  },
  {
    id: "house-ramenskoe",
    name: "Дом в Раменском",
    city: "Раменское",
    client: "Илья и Мария",
    type: "Отделка под ключ",
    status: "На согласовании",
    deadline: "12 дек 2026",
    estimate: [
      {
        id: "base",
        name: "Общестроительные работы",
        items: [
          {
            id: "b1",
            name: "Стяжка пола",
            qty: 112,
            unit: "м²",
            price: 780,
          },
          {
            id: "b2",
            name: "Грунтовка стен",
            qty: 210,
            unit: "м²",
            price: 110,
          },
        ],
      },
    ],
  },
  {
    id: "office-tverskaya",
    name: "Офис на Тверской",
    city: "Москва",
    client: "ООО «Север»",
    type: "Реконструкция",
    status: "Завершён",
    deadline: "30 сен 2026",
    estimate: [
      {
        id: "finish",
        name: "Чистовая отделка",
        items: [
          {
            id: "f1",
            name: "Укладка напольного покрытия",
            qty: 74,
            unit: "м²",
            price: 1250,
          },
          {
            id: "f2",
            name: "Монтаж плинтуса",
            qty: 48,
            unit: "м.п.",
            price: 390,
          },
        ],
      },
    ],
  },
];

const initialNotifications: Notification[] = [
  {
    id: "welcome",
    title: "Добро пожаловать в Сметограм",
    text: "Ваше рабочее пространство готово к работе.",
    time: "Только что",
    type: "system",
    read: false,
  },
  {
    id: "estimate-review",
    title: "Смета требует внимания",
    text: "По проекту «Дом в Раменском» смета находится на согласовании.",
    time: "10 минут назад",
    type: "estimate",
    read: false,
  },
  {
    id: "deadline",
    title: "Приближается срок проекта",
    text: "По квартире на Крылатском срок сдачи — 20 ноя 2026.",
    time: "Сегодня",
    type: "deadline",
    read: false,
  },
  {
    id: "completed",
    title: "Проект завершён",
    text: "Офис на Тверской отмечен как завершённый.",
    time: "Вчера",
    type: "project",
    read: true,
  },
];

function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;
  return <AuthenticatedApp user={user} logout={logout} />;
}

function AuthLoadingScreen() { return <div className="auth-screen"><div className="auth-card"><img src="/smetogram-logo.png" alt="Сметограм" className="auth-logo" /><div className="auth-spinner" /><p>Проверяем авторизацию…</p></div></div>; }
function LoginScreen() { return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><img src="/smetogram-logo.png" alt="Сметограм" className="auth-logo" /><span>сметограм</span></div><div className="auth-eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</div><h1>Сметы без хаоса.</h1><p className="auth-description">Войдите, чтобы создавать проекты, вести сметы и работать с командой в одном пространстве.</p><button type="button" className="auth-login-button" onClick={startLogin}>Войти в Сметограм <ArrowUpRight size={18} /></button><div className="auth-note">Без пароля — вход через защищённую авторизацию.</div></div></div>; }
function getInitials(value: string) { const parts = value.trim().split(/\s+/).filter(Boolean); if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase(); return value.slice(0, 2).toUpperCase(); }

function AuthenticatedApp({ user, logout }: { user: any; logout: () => Promise<void> }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("smetogram-projects");

      if (!saved) {
        return initialProjects;
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed) ? parsed : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [notifications, setNotifications] = useState<
    Notification[]
  >(() => {
    try {
      const saved = localStorage.getItem(
        "smetogram-notifications",
      );

      if (!saved) {
        return initialNotifications;
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [activeId, setActiveId] = useState<string | null>(
    null,
  );

  const [view, setView] = useState<
    "projects" | "estimate" | Module
  >("projects");

  const [showCreate, setShowCreate] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const [projectQuery, setProjectQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState<
    "Все статусы" | Status
  >("Все статусы");

  const [globalSearchOpen, setGlobalSearchOpen] =
    useState(false);

  const [globalSearch, setGlobalSearch] = useState("");

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const searchInputRef =
    useRef<HTMLInputElement | null>(null);

  const notificationsRef =
    useRef<HTMLDivElement | null>(null);

  const projectsQuery = trpc.projects.list.useQuery(undefined, { staleTime: 5_000 });
  const createProjectMutation = trpc.projects.create.useMutation();
  const updateProjectMutation = trpc.projects.update.useMutation();
  const replaceEstimateMutation = trpc.estimates.replace.useMutation();

  useEffect(() => {
    if (!projectsQuery.data) return;
    setProjects(projectsQuery.data.map((project: any) => ({
      id: String(project.id), name: project.name, city: project.city, client: project.clientName, type: project.workType,
      status: project.status === "in_progress" ? "В работе" : project.status === "review" ? "На согласовании" : project.status === "completed" ? "Завершён" : "В работе",
      deadline: project.deadline ? new Date(project.deadline).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).replace(" г.", "") : "—",
      estimate: (project.estimate || []).map((group: any) => ({ id: String(group.id), name: group.name, items: (group.items || []).map((item: any) => ({ id: String(item.id), name: item.name, qty: Number(item.quantity), unit: item.unit, price: Number(item.price), kind: item.source === "ai" ? "work" : undefined })) })),
    })));
  }, [projectsQuery.data]);

  useEffect(() => {
    localStorage.setItem(
      "smetogram-notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  useEffect(() => {
    if (!globalSearchOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [globalSearchOpen]);

  useEffect(() => {
    if (!globalSearchOpen && !notificationsOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGlobalSearchOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [globalSearchOpen, notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [notificationsOpen]);

  const activeProject =
    projects.find((project) => project.id === activeId) ||
    null;

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const globalResults = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    if (!query) {
      return projects.slice(0, 6);
    }

    return projects
      .filter((project) => {
        const haystack = [
          project.name,
          project.city,
          project.client,
          project.type,
          project.status,
          project.region || "",
          ...project.estimate.flatMap((group) => [
            group.name,
            ...group.items.map((item) => item.name),
          ]),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [globalSearch, projects]);

  const openProject = (id: string) => {
    setActiveId(id);
    setView("estimate");
    setShowMobileNav(false);
    setGlobalSearchOpen(false);
    setGlobalSearch("");
    setNotificationsOpen(false);
  };

  const updateProject = (updated: Project) => {
    const previous = projects.find((project) => project.id === updated.id);
    setProjects((current) => current.map((project) => project.id === updated.id ? updated : project));
    const projectId = Number(updated.id);
    if (!Number.isInteger(projectId)) return;
    const statusMap: Record<Status, "draft" | "in_progress" | "review" | "completed"> = { "В работе": "in_progress", "На согласовании": "review", "Завершён": "completed" };
    void updateProjectMutation.mutateAsync({ projectId, name: updated.name, city: updated.city, clientName: updated.client, workType: updated.type, status: statusMap[updated.status] }).catch((error) => console.error("[Сметограм] Не удалось сохранить проект:", error));
    if (previous) void replaceEstimateMutation.mutateAsync({ projectId, groups: updated.estimate.map((group,index)=>({ name:group.name, sortOrder:index, items:group.items.map(item=>({name:item.name,quantity:String(item.qty),unit:item.unit,price:String(item.price),source:"manual" as const})) })) }).then((saved:any)=>{
      const normalized=(saved||[]).map((group:any)=>({id:String(group.id),name:group.name,items:(group.items||[]).map((item:any)=>({id:String(item.id),name:item.name,qty:Number(item.quantity),unit:item.unit,price:Number(item.price)}))}));
      setProjects((current)=>current.map(project=>project.id===updated.id?{...project,estimate:normalized}:project));
    }).catch((error)=>console.error("[Сметограм] Не удалось сохранить смету:",error));
  };

  const addProject = async (data: Omit<Project, "id" | "estimate">) => {
    try {
      const created:any = await createProjectMutation.mutateAsync({name:data.name,city:data.city,clientName:data.client,workType:data.type});
      const project:Project={...data,id:String(created.id),estimate:[{id:makeId(),name:"Новая категория",items:[]}]};
      setProjects(current=>[project,...current]); setShowCreate(false); setActiveId(project.id); setView("estimate");
      const saved:any=await replaceEstimateMutation.mutateAsync({projectId:Number(project.id),groups:[{name:"Новая категория",sortOrder:0,items:[]}]});
      setProjects(current=>current.map(item=>item.id===project.id?{...item,estimate:(saved||[]).map((g:any)=>({id:String(g.id),name:g.name,items:(g.items||[]).map((x:any)=>({id:String(x.id),name:x.name,qty:Number(x.quantity),unit:x.unit,price:Number(x.price)}))}))}:item));
      setNotifications(current=>[{id:makeId(),title:"Создан новый проект",text:`Проект «${project.name}» успешно создан.`,time:"Только что",type:"project",read:false},...current]);
    } catch(error){ console.error("[Сметограм] Не удалось создать проект:",error); }
  };

  const openNotifications = () => {
    console.log("[Сметограм] Уведомления открыты");

    setGlobalSearchOpen(false);
    setNotificationsOpen((current) => !current);
  };

  const openGlobalSearch = () => {
    console.log("[Сметограм] Поиск открыт");

    setNotificationsOpen(false);
    setGlobalSearch("");
    setGlobalSearchOpen(true);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((current) =>
      current.filter(
        (notification) => notification.id !== id,
      ),
    );
  };

  const openNotification = (
    notification: Notification,
  ) => {
    markNotificationRead(notification.id);

    if (notification.type === "estimate") {
      const project = projects.find((item) =>
        notification.text.includes(item.name),
      );

      if (project) {
        openProject(project.id);
      }
    }

    setNotificationsOpen(false);
  };

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${
          showMobileNav ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <img
            className="brand-logo"
            src="/smetogram-logo.png"
            alt=""
          />
          <span>сметограм</span>
        </div>

        <button
          type="button"
          className="mobile-close"
          onClick={() => setShowMobileNav(false)}
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>

        <div className="workspace-label">
          РАБОЧЕЕ ПРОСТРАНСТВО
        </div>

        <nav className="nav-list">
          <NavItem
            icon={<LayoutGrid size={18} />}
            label="Мои проекты"
            active={view === "projects"}
            onClick={() => {
              setView("projects");
              setShowMobileNav(false);
            }}
            count={projects.length}
          />

          <NavItem
            icon={<ClipboardList size={18} />}
            label="Смета из файла"
            active={view === "scan"}
            onClick={() => {
              setView("scan");
              setShowMobileNav(false);
            }}
          />

          <NavItem
            icon={<Home size={18} />}
            label="Замеры"
            active={view === "measurements"}
            onClick={() => {
              setView("measurements");
              setShowMobileNav(false);
            }}
          />

          <NavItem
            icon={<CalendarDays size={18} />}
            label="График работ"
            active={view === "schedule"}
            onClick={() => {
              setView("schedule");
              setShowMobileNav(false);
            }}
          />

          <NavItem
            icon={<BarChart3 size={18} />}
            label="Графики"
            active={view === "analytics"}
            onClick={() => {
              setView("analytics");
              setShowMobileNav(false);
            }}
          />

          <NavItem
            icon={<Users size={18} />}
            label="Команда"
            active={view === "team"}
            onClick={() => {
              setView("team");
              setShowMobileNav(false);
            }}
          />
        </nav>

        <div className="sidebar-spacer" />

        <div className="trial-card">
          <div className="trial-icon">
            <Sparkles size={16} />
          </div>

          <div>
            <strong>Первый проект бесплатно</strong>
            <span>Без карты и обязательств</span>
          </div>

          <ArrowUpRight size={16} />
        </div>

        <nav className="nav-list bottom-nav">
          <NavItem
            icon={<Settings2 size={18} />}
            label="Настройки"
            active={view === "settings"}
            onClick={() => {
              setView("settings");
              setShowMobileNav(false);
            }}
          />

          <NavItem
            icon={<Bell size={18} />}
            label="Уведомления"
            dot={unreadNotifications > 0}
            onClick={openNotifications}
          />
        </nav>

        <div className="profile">
          <div className="avatar">{getInitials(user?.name || user?.email || "Пользователь")}</div>
          <div className="profile-copy"><strong>{user?.name || "Пользователь"}</strong><span>{user?.email || "Аккаунт"}</span></div>
          <button type="button" className="profile-logout" onClick={() => void logout()} title="Выйти" aria-label="Выйти"><LogOut size={16} /></button>
        </div>
      </aside>

      {showMobileNav && (
        <div
          className="sidebar-backdrop"
          onClick={() => setShowMobileNav(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            onClick={() => setShowMobileNav(true)}
            aria-label="Открыть меню"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumbs">
            <span>Рабочее пространство</span>
            <span className="slash">/</span>

            <strong>
              {view === "projects"
                ? "Мои проекты"
                : activeProject?.name ||
                  "Рабочее пространство"}
            </strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openGlobalSearch();
              }}
              aria-label="Поиск"
              title="Поиск"
            >
              <Search size={19} />
            </button>

            <div
              className="notification-wrap"
              ref={notificationsRef}
            >
              <button
                type="button"
                className={`icon-button notification ${
                  notificationsOpen ? "active" : ""
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openNotifications();
                }}
                aria-label="Уведомления"
                title="Уведомления"
              >
                <Bell size={19} />

                {unreadNotifications > 0 && (
                  <i className="notification-badge">
                    {unreadNotifications > 9
                      ? "9+"
                      : unreadNotifications}
                  </i>
                )}
              </button>

              {notificationsOpen && (
                <NotificationsDropdown
                  notifications={notifications}
                  unreadCount={unreadNotifications}
                  onRead={markNotificationRead}
                  onReadAll={markAllNotificationsRead}
                  onRemove={removeNotification}
                  onOpen={openNotification}
                />
              )}
            </div>

            <div className="top-avatar">АК</div>
          </div>
        </header>

        {view === "projects" ? (
          <ProjectsView
            projects={projects}
            onOpen={openProject}
            onCreate={() => setShowCreate(true)}
            query={projectQuery}
            status={projectStatus}
            onQueryChange={setProjectQuery}
            onStatusChange={setProjectStatus}
          />
        ) : view === "estimate" ? (
          activeProject ? (
            <EstimateView
              project={activeProject}
              onBack={() => setView("projects")}
              onUpdate={updateProject}
            />
          ) : (
            <ProjectsView
              projects={projects}
              onOpen={openProject}
              onCreate={() => setShowCreate(true)}
              query={projectQuery}
              status={projectStatus}
              onQueryChange={setProjectQuery}
              onStatusChange={setProjectStatus}
            />
          )
        ) : (
          <WorkspaceModules
            kind={view}
            project={activeProject}
          />
        )}
      </main>

      {globalSearchOpen && (
        <GlobalSearch
          query={globalSearch}
          results={globalResults}
          inputRef={searchInputRef}
          onChange={setGlobalSearch}
          onClose={() => {
            setGlobalSearchOpen(false);
            setGlobalSearch("");
          }}
          onOpenProject={openProject}
        />
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={addProject}
        />
      )}
    </div>
  );
}

function GlobalSearch({
  query,
  results,
  inputRef,
  onChange,
  onClose,
  onOpenProject,
}: {
  query: string;
  results: Project[];
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onClose: () => void;
  onOpenProject: (id: string) => void;
}) {
  return (
    <div
      className="global-search-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="global-search-panel">
        <div className="global-search-input-wrap">
          <Search size={20} />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder="Поиск проекта, клиента, города, работы..."
            autoComplete="off"
          />

          <button
            type="button"
            className="global-search-close"
            onClick={onClose}
            aria-label="Закрыть поиск"
          >
            <X size={18} />
          </button>
        </div>

        <div className="global-search-hint">
          {query
            ? `Результаты поиска для «${query}»`
            : "Начните вводить название проекта, клиента или работы"}
        </div>

        <div className="global-search-results">
          {results.length ? (
            results.map((project) => {
              const total = projectTotal(
                project.estimate,
              );

              return (
                <button
                  type="button"
                  className="global-search-result"
                  key={project.id}
                  onClick={() =>
                    onOpenProject(project.id)
                  }
                >
                  <div className="global-result-icon">
                    <Home size={18} />
                  </div>

                  <div className="global-result-content">
                    <strong>{project.name}</strong>

                    <span>
                      {project.city}
                      {" · "}
                      {project.client}
                      {" · "}
                      {project.type}
                    </span>

                    <small>
                      {project.status}
                      {" · "}
                      {money.format(total)} ₽
                    </small>
                  </div>

                  <ArrowUpRight size={17} />
                </button>
              );
            })
          ) : (
            <div className="global-search-empty">
              <Search size={24} />

              <strong>Ничего не найдено</strong>

              <span>
                Попробуйте изменить поисковый запрос.
              </span>
            </div>
          )}
        </div>

        <div className="global-search-footer">
          <span>
            <kbd>ESC</kbd> закрыть
          </span>

          <span>
            Найдено: <b>{results.length}</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function NotificationsDropdown({
  notifications,
  unreadCount,
  onRead,
  onReadAll,
  onRemove,
  onOpen,
}: {
  notifications: Notification[];
  unreadCount: number;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onRemove: (id: string) => void;
  onOpen: (notification: Notification) => void;
}) {
  return (
    <div className="notifications-dropdown">
      <div className="notifications-heading">
        <div>
          <strong>Уведомления</strong>

          <span>
            {unreadCount
              ? `${unreadCount} непрочитанных`
              : "Всё прочитано"}
          </span>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-read-all"
            onClick={onReadAll}
          >
            Прочитать всё
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length ? (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onRemove={onRemove}
              onOpen={onOpen}
            />
          ))
        ) : (
          <div className="notifications-empty">
            <Bell size={25} />

            <strong>Уведомлений нет</strong>

            <span>
              Здесь появятся важные события.
            </span>
          </div>
        )}
      </div>

      <div className="notifications-footer">
        Все события сохраняются в этом браузере
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onRemove,
  onOpen,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (notification: Notification) => void;
}) {
  const icon =
    notification.type === "estimate" ? (
      <Receipt size={17} />
    ) : notification.type === "deadline" ? (
      <CalendarDays size={17} />
    ) : notification.type === "project" ? (
      <FolderKanban size={17} />
    ) : (
      <Sparkles size={17} />
    );

  return (
    <div
      className={`notification-row ${
        notification.read ? "" : "unread"
      }`}
    >
      <button
        type="button"
        className="notification-main"
        onClick={() => onOpen(notification)}
      >
        <div
          className={`notification-icon notification-type-${notification.type}`}
        >
          {icon}
        </div>

        <div className="notification-content">
          <strong>{notification.title}</strong>
          <span>{notification.text}</span>
          <small>{notification.time}</small>
        </div>

        {!notification.read && (
          <i className="notification-unread-dot" />
        )}
      </button>

      <div className="notification-actions">
        {!notification.read && (
          <button
            type="button"
            onClick={() =>
              onRead(notification.id)
            }
            aria-label="Отметить как прочитанное"
            title="Отметить как прочитанное"
          >
            <Check size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            onRemove(notification.id)
          }
          aria-label="Удалить уведомление"
          title="Удалить"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  count,
  dot,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: number;
  dot?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>

      <span>{label}</span>

      {count !== undefined && <em>{count}</em>}

      {dot && <i className="nav-dot" />}
    </button>
  );
}

function ProjectsView({
  projects,
  onOpen,
  onCreate,
  query,
  status,
  onQueryChange,
  onStatusChange,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  query: string;
  status: "Все статусы" | Status;
  onQueryChange: (value: string) => void;
  onStatusChange: (
    value: "Все статусы" | Status,
  ) => void;
}) {
  const total = projects.reduce(
    (sum, project) =>
      sum + projectTotal(project.estimate),
    0,
  );

  const filtered = projects.filter((project) => {
    const haystack =
      `${project.name} ${project.city} ${project.client} ${project.type}`.toLowerCase();

    return (
      haystack.includes(query.trim().toLowerCase()) &&
      (status === "Все статусы" ||
        project.status === status)
    );
  });

  const activeCount = projects.filter(
    (project) => project.status !== "Завершён",
  ).length;

  return (
    <section className="page-wrap projects-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            СЕГОДНЯ,{" "}
            {new Date()
              .toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              .toUpperCase()}
          </div>

          <h1>Добрый день, Алексей</h1>

          <p className="lede">
            Все объекты, сметы и текущие задачи — в одном
            рабочем пространстве.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onCreate}
        >
          <Plus size={18} />
          Новый проект
        </button>
      </div>

      <div className="metric-grid">
        <Metric
          label="Активные проекты"
          value={String(activeCount).padStart(2, "0")}
          detail="сейчас в работе"
          icon={<FolderKanban size={19} />}
          tone="sage"
        />

        <Metric
          label="Общая сумма смет"
          value={`${money.format(total)} ₽`}
          detail="по всем объектам"
          icon={<Receipt size={19} />}
          tone="terra"
        />

        <Metric
          label="Сдано этапов"
          value="12"
          detail="за текущий месяц"
          icon={<Check size={20} />}
          tone="sand"
        />
      </div>

      <div className="section-title-row">
        <div>
          <h2>
            Ваши проекты <span>{filtered.length}</span>
          </h2>

          <p>
            {query || status !== "Все статусы"
              ? "Результаты поиска и фильтрации"
              : "Все объекты в одном месте"}
          </p>
        </div>

        <div className="filter-row">
          <label className="project-search">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) =>
                onQueryChange(event.target.value)
              }
              placeholder="Поиск проекта, клиента..."
            />
          </label>

          <select
            className="filter-button filter-select"
            value={status}
            onChange={(event) =>
              onStatusChange(
                event.target.value as
                  | "Все статусы"
                  | Status,
              )
            }
          >
            <option>Все статусы</option>
            <option>В работе</option>
            <option>На согласовании</option>
            <option>Завершён</option>
          </select>
        </div>
      </div>

      <div className="project-grid">
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onOpen(project.id)}
          />
        ))}

        <button
          type="button"
          className="new-project-card"
          onClick={onCreate}
        >
          <span>
            <Plus size={20} />
          </span>

          <strong>Создать новый проект</strong>

          <small>
            Смета, график и документы в одном месте
          </small>
        </button>
      </div>

      {!filtered.length && (
        <div className="empty-projects">
          <Search size={22} />

          <strong>Ничего не найдено</strong>

          <span>
            Измените запрос или сбросьте фильтр.
          </span>

          <button
            type="button"
            className="outline-button"
            onClick={() => {
              onQueryChange("");
              onStatusChange("Все статусы");
            }}
          >
            Сбросить
          </button>
        </div>
      )}

      <div className="bottom-callout">
        <div className="callout-icon">
          <BarChart3 size={20} />
        </div>

        <div>
          <strong>Следующий шаг</strong>

          <p>
            Откройте объект, добавьте позиции в смету и
            сформируйте документы без повторного ввода
            данных.
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>

        <small>
          <span className="trend">↗</span> {detail}
        </small>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const total = projectTotal(project.estimate);

  const progress =
    project.status === "Завершён"
      ? 100
      : project.status === "На согласовании"
        ? 38
        : 64;

  return (
    <button
      type="button"
      className="project-card"
      onClick={onClick}
    >
      <div className="card-top">
        <span
          className={`status status-${
            project.status === "В работе"
              ? "active"
              : project.status === "Завершён"
                ? "done"
                : "review"
          }`}
        >
          <i />
          {project.status}
        </span>

        <MoreHorizontal
          size={18}
          className="muted-icon"
        />
      </div>

      <div className="project-info">
        <h3>{project.name}</h3>

        <span>
          {project.city} <b>·</b> {project.type}
        </span>
      </div>

      <div className="client-line">
        <div className="mini-avatar">
          {project.client
            .split(" ")
            .map((value) => value[0])
            .join("")
            .slice(0, 2)}
        </div>

        <span>{project.client}</span>
      </div>

      <div className="progress-meta">
        <span>Прогресс</span>
        <strong>{progress}%</strong>
      </div>

      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="card-footer">
        <span>
          <CalendarDays size={15} />
          до {project.deadline}
        </span>

        <strong>{money.format(total)} ₽</strong>
      </div>
    </button>
  );
}

function EstimateView({
  project,
  onBack,
  onUpdate,
}: {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}) {
  const direct = projectTotal(project.estimate);

  const [editing, setEditing] =
    useState<string | null>(null);

  const [newCategory, setNewCategory] =
    useState(false);

  const [normativeOpen, setNormativeOpen] =
    useState(false);

  const [exportOpen, setExportOpen] =
    useState(false);

  const [method, setMethod] =
    useState("Ресурсный");

  const [winter, setWinter] =
    useState(false);

  const [tight, setTight] =
    useState(false);

  const [custom, setCustom] =
    useState(1);

  const overhead = direct * 0.15;
  const profit = direct * 0.08;

  const coefficient =
    (winter ? 1.12 : 1) *
    (tight ? 1.08 : 1) *
    custom;

  const subtotal =
    (direct + overhead + profit) *
    coefficient;

  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  const updateGroup = (group: EstimateGroup) => {
    onUpdate({
      ...project,
      estimate: project.estimate.map((item) =>
        item.id === group.id ? group : item,
      ),
    });
  };

  const addItem = (group: EstimateGroup) => {
    updateGroup({
      ...group,
      items: [
        ...group.items,
        {
          id: makeId(),
          name: "Новая позиция",
          qty: 1,
          unit: "шт",
          price: 0,
        },
      ],
    });
  };

  const deleteItem = (
    group: EstimateGroup,
    itemId: string,
  ) => {
    updateGroup({
      ...group,
      items: group.items.filter(
        (item) => item.id !== itemId,
      ),
    });
  };

  const deleteGroup = (groupId: string) => {
    onUpdate({
      ...project,
      estimate: project.estimate.filter(
        (group) => group.id !== groupId,
      ),
    });
  };

  const addGroup = (name: string) => {
    if (name.trim()) {
      onUpdate({
        ...project,
        estimate: [
          ...project.estimate,
          {
            id: makeId(),
            name: name.trim(),
            items: [],
          },
        ],
      });
    }

    setNewCategory(false);
  };

  return (
    <section className="page-wrap estimate-page">
      <div className="estimate-heading">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            Все проекты
          </button>

          <div className="estimate-title-row">
            <div className="project-symbol">
              <Home size={21} />
              <Check size={12} />
            </div>

            <div>
              <div className="eyebrow">
                ПРОЕКТ / СМЕТА
              </div>

              <h1>{project.name}</h1>

              <p>
                {project.city} <b>·</b>{" "}
                {project.client} <b>·</b>{" "}
                {project.type}
              </p>
            </div>
          </div>
        </div>

        <div className="heading-actions">
          <select
            className="status-select"
            value={project.status}
            onChange={(event) =>
              onUpdate({
                ...project,
                status:
                  event.target.value as Status,
              })
            }
          >
            <option>В работе</option>
            <option>На согласовании</option>
            <option>Завершён</option>
          </select>

          <button
            type="button"
            className="outline-button"
            onClick={() => setExportOpen(true)}
          >
            <FileText size={17} />
            Экспорт сметы
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => setNormativeOpen(true)}
          >
            <Plus size={18} />
            Добавить
          </button>
        </div>
      </div>

      <div className="estimate-summary">
        <div>
          <span>ИТОГО ПО СМЕТЕ</span>

          <strong>
            {money.format(total)} ₽
          </strong>

          <small>включая НДС 20%</small>
        </div>

        <div className="summary-stats">
          <span>
            <b>{project.estimate.length}</b>{" "}
            категории
          </span>

          <span>
            <b>
              {project.estimate.reduce(
                (sum, group) =>
                  sum + group.items.length,
                0,
              )}
            </b>{" "}
            позиций
          </span>

          <span>
            <b>
              {project.estimate.reduce(
                (sum, group) =>
                  sum +
                  group.items.reduce(
                    (value, item) =>
                      value + item.qty,
                    0,
                  ),
                0,
              )}
            </b>{" "}
            объём
          </span>
        </div>

        <div className="summary-actions">
          <button
            type="button"
            className="outline-button"
          >
            <CalendarDays size={16} />
            Создать график
          </button>

          <button
            type="button"
            className="icon-button darkish"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="estimate-controls">
        <div>
          <span className="control-label">
            МЕТОД РАСЧЁТА
          </span>

          <select
            className="status-select"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value)
            }
          >
            <option>Ресурсный</option>
            <option>Базисно-индексный</option>
            <option>Ресурсно-индексный</option>
          </select>
        </div>

        <label className="check-control">
          <input
            type="checkbox"
            checked={winter}
            onChange={(event) =>
              setWinter(event.target.checked)
            }
          />
          Зимнее удорожание <b>+12%</b>
        </label>

        <label className="check-control">
          <input
            type="checkbox"
            checked={tight}
            onChange={(event) =>
              setTight(event.target.checked)
            }
          />
          Стеснённые условия <b>+8%</b>
        </label>

        <label className="custom-coeff">
          Свой коэффициент

          <input
            type="number"
            min="0.1"
            max="5"
            step="0.01"
            value={custom}
            onChange={(event) =>
              setCustom(
                Number(event.target.value) || 1,
              )
            }
          />
        </label>
      </div>

      <div className="estimate-toolbar">
        <div className="toolbar-tabs">
          <button
            type="button"
            className="active"
          >
            Смета
          </button>

          <button type="button">
            График <span>скоро</span>
          </button>

          <button type="button">
            Документы <span>скоро</span>
          </button>
        </div>

        <div className="estimate-actions">
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setNormativeOpen(true)
            }
          >
            <Plus size={16} />
            Добавить расценку
          </button>

          <button
            type="button"
            className="text-button"
            onClick={() => setNewCategory(true)}
          >
            <Plus size={16} />
            Добавить категорию
          </button>
        </div>
      </div>

      {normativeOpen && (
        <NormativePicker
          onClose={() => setNormativeOpen(false)}
          onAdd={(item) => {
            const group = project.estimate[0];

            if (group) {
              updateGroup({
                ...group,
                items: [
                  ...group.items,
                  item,
                ],
              });
            } else {
              onUpdate({
                ...project,
                estimate: [
                  {
                    id: makeId(),
                    name: "Новая категория",
                    items: [item],
                  },
                ],
              });
            }

            setNormativeOpen(false);
          }}
        />
      )}

      <div className="estimate-list">
        {project.estimate.map(
          (group, index) => (
            <EstimateGroup
              key={group.id}
              group={group}
              index={index}
              editing={editing}
              setEditing={setEditing}
              onUpdate={updateGroup}
              onAddItem={addItem}
              onDeleteItem={deleteItem}
              onDeleteGroup={deleteGroup}
            />
          ),
        )}

        {newCategory && (
          <form
            className="new-category-form"
            onSubmit={(event) => {
              event.preventDefault();

              const form = event.currentTarget;
              const formData = new FormData(form);

              addGroup(
                formData.get("name")?.toString() ||
                  "",
              );
            }}
          >
            <input
              name="name"
              autoFocus
              placeholder="Название категории"
            />

            <button
              className="primary-button"
              type="submit"
            >
              <Check size={16} />
              Добавить
            </button>

            <button
              className="icon-button"
              type="button"
              onClick={() =>
                setNewCategory(false)
              }
            >
              <X size={17} />
            </button>
          </form>
        )}
      </div>

      <div className="estimate-totals">
        <div>
          <span>Прямые затраты</span>
          <b>{money.format(direct)} ₽</b>
        </div>

        <div>
          <span>
            Накладные расходы (НР) · 15%
          </span>

          <b>
            {money.format(overhead)} ₽
          </b>
        </div>

        <div>
          <span>
            Сметная прибыль (СП) · 8%
          </span>

          <b>
            {money.format(profit)} ₽
          </b>
        </div>

        <div>
          <span>Коэффициенты</span>
          <b>
            × {coefficient.toFixed(3)}
          </b>
        </div>

        <div>
          <span>НДС · 20%</span>
          <b>{money.format(vat)} ₽</b>
        </div>

        <div className="grand-total">
          <span>
            Итого в текущем уровне цен
          </span>

          <strong>
            {money.format(total)} ₽
          </strong>
        </div>

        <button
          type="button"
          className="outline-button"
          onClick={() =>
            setExportOpen(true)
          }
        >
          Выбрать экспорт
        </button>

        <button
          type="button"
          className="outline-button"
          onClick={() =>
            exportAct(project, "КС-2")
          }
        >
          Сформировать КС-2
        </button>

        <button
          type="button"
          className="outline-button"
          onClick={() =>
            exportAct(project, "КС-3")
          }
        >
          Сформировать КС-3
        </button>
      </div>

      {exportOpen && (
        <ExportPicker
          project={project}
          onClose={() =>
            setExportOpen(false)
          }
        />
      )}
    </section>
  );
}

function EstimateGroup({
  group,
  index,
  editing,
  setEditing,
  onUpdate,
  onAddItem,
  onDeleteItem,
  onDeleteGroup,
}: {
  group: EstimateGroup;
  index: number;
  editing: string | null;
  setEditing: (id: string | null) => void;
  onUpdate: (group: EstimateGroup) => void;
  onAddItem: (group: EstimateGroup) => void;
  onDeleteItem: (
    group: EstimateGroup,
    itemId: string,
  ) => void;
  onDeleteGroup: (id: string) => void;
}) {
  const subtotal = groupTotal(group);

  return (
    <div className="estimate-group">
      <div className="group-heading">
        <div className="group-number">
          0{index + 1}
        </div>

        <h3>{group.name}</h3>

        <span>
          {group.items.length}{" "}
          {plural(
            group.items.length,
            "позиция",
            "позиции",
            "позиций",
          )}
        </span>

        <strong>
          {money.format(subtotal)} ₽
        </strong>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            onDeleteGroup(group.id)
          }
          aria-label="Удалить категорию"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="estimate-table">
        <div className="table-head">
          <span>РАБОТА</span>
          <span>ОБЪЁМ</span>
          <span>ЕД.</span>
          <span>ЦЕНА</span>
          <span>СУММА</span>
          <span />
        </div>

        {group.items.map((item) => (
          <EstimateRow
            key={item.id}
            item={item}
            editing={editing === item.id}
            onEdit={() =>
              setEditing(item.id)
            }
            onCancel={() =>
              setEditing(null)
            }
            onSave={(updated) => {
              onUpdate({
                ...group,
                items: group.items.map(
                  (current) =>
                    current.id === item.id
                      ? updated
                      : current,
                ),
              });

              setEditing(null);
            }}
            onDelete={() =>
              onDeleteItem(
                group,
                item.id,
              )
            }
          />
        ))}

        <button
          type="button"
          className="add-row"
          onClick={() =>
            onAddItem(group)
          }
        >
          <Plus size={16} />
          Добавить работу
        </button>
      </div>
    </div>
  );
}

function ExportPicker({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const choose = (
    format: "pdf" | "excel" | "xml",
  ) => {
    if (format === "pdf") {
      exportPdf(project);
    } else if (format === "excel") {
      exportEstimate(project);
    } else {
      exportAct(project, "КС-2");
    }

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="export-picker">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">
              ЭКСПОРТ ПРОЕКТА
            </div>

            <h2>Выберите формат</h2>

            <p>
              Смета будет сформирована из текущих
              данных проекта.
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="export-options">
          <button
            type="button"
            onClick={() => choose("pdf")}
          >
            <FileText size={24} />
            <strong>PDF</strong>
            <span>
              Печать или сохранение документа
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              choose("excel")
            }
          >
            <Receipt size={24} />
            <strong>Excel</strong>
            <span>
              Таблица CSV, открывается в Excel
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              choose("xml")
            }
          >
            <FolderKanban size={24} />
            <strong>XML / КС-2</strong>
            <span>
              Обменный черновик для проверки
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NormativePicker({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: EstimateItem) => void;
}) {
  const [base, setBase] = useState("ФЕР");
  const [query, setQuery] = useState("");

  const rates = [
    {
      code: "ФЕР 11-01-001-01",
      name: "Укладка ламината",
      unit: "м²",
      price: 1250,
    },
    {
      code: "ФЕР 15-04-005-04",
      name: "Штукатурка стен",
      unit: "м²",
      price: 920,
    },
    {
      code: "ГЭСН 08-02-410-01",
      name: "Монтаж розетки",
      unit: "шт",
      price: 480,
    },
    {
      code: "ТЕР 06-01-001-03",
      name: "Устройство стяжки пола",
      unit: "м²",
      price: 780,
    },
  ].filter((rate) =>
    `${rate.code} ${rate.name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="modal-backdrop">
      <div className="normative-modal">
        <div className="modal-heading">
          <div>
            <div className="eyebrow">
              НОРМАТИВНАЯ БАЗА
            </div>

            <h2>Добавить расценку</h2>

            <p>
              Каталог подключаемых ФЕР/ТЕР/ГЭСН;
              цены требуют проверки региона.
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="normative-tabs">
          {["ФЕР", "ТЕР", "ГЭСН"].map(
            (item) => (
              <button
                type="button"
                className={
                  base === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setBase(item)
                }
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <input
          className="normative-search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Поиск по шифру или наименованию"
        />

        {rates.map((rate) => (
          <div
            className="normative-row"
            key={rate.code}
          >
            <div>
              <strong>{rate.name}</strong>

              <span>
                {rate.code} · {base} ·{" "}
                {rate.unit}
              </span>
            </div>

            <b>
              {money.format(rate.price)} ₽
            </b>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                onAdd({
                  id: makeId(),
                  name: rate.name,
                  qty: 1,
                  unit: rate.unit,
                  price: rate.price,
                  normative: rate.code,
                  kind: "work",
                })
              }
            >
              Добавить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstimateRow({
  item,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  item: EstimateItem;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (item: EstimateItem) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] =
    useState<EstimateItem>(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  const input = (
    key: keyof EstimateItem,
    type = "text",
  ) => (
    <input
      className="cell-input"
      type={type}
      value={String(
        draft[key] ?? "",
      )}
      onChange={(event) =>
        setDraft({
          ...draft,
          [key]:
            type === "number"
              ? Number(event.target.value)
              : event.target.value,
        })
      }
    />
  );

  return (
    <div
      className={`table-row ${
        editing ? "is-editing" : ""
      }`}
      onDoubleClick={onEdit}
    >
      {editing ? (
        <>
          <div>{input("name")}</div>

          <div>
            {input("qty", "number")}
          </div>

          <div>{input("unit")}</div>

          <div>
            {input("price", "number")}
          </div>

          <strong>
            {money.format(
              draft.qty * draft.price,
            )}{" "}
            ₽
          </strong>

          <div className="row-actions">
            <button
              type="button"
              className="save-row"
              onClick={() =>
                onSave(draft)
              }
            >
              <Check size={15} />
            </button>

            <button
              type="button"
              className="cancel-row"
              onClick={onCancel}
            >
              <X size={15} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="work-name">
            <span className="work-dot" />
            {item.name}
          </div>

          <span>{item.qty}</span>

          <span>{item.unit}</span>

          <span>
            {money.format(item.price)} ₽
          </span>

          <strong>
            {money.format(
              item.qty * item.price,
            )}{" "}
            ₽
          </strong>

          <div className="row-actions">
            <button
              type="button"
              onClick={onEdit}
              className="edit-label"
            >
              Изменить
            </button>

            <button
              type="button"
              onClick={onDelete}
              aria-label="Удалить работу"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (
    data: Omit<Project, "id" | "estimate">,
  ) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    city: "",
    client: "",
    type: "Капитальный ремонт",
    status: "В работе" as Status,
    deadline: "15 дек 2026",
    area: "",
    region: "Москва",
    method: "Ресурсный",
  });

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();

          if (
            form.name.trim() &&
            form.city.trim() &&
            form.client.trim() &&
            Number(form.area) > 0
          ) {
            onCreate({
              ...form,
              area: Number(form.area),
            });
          }
        }}
      >
        <div className="modal-heading">
          <div>
            <div className="eyebrow">
              ШАГ 1 · ПАРАМЕТРЫ ОБЪЕКТА
            </div>

            <h2>Создать смету</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <label>
          Название проекта

          <input
            required
            value={form.name}
            onChange={(event) =>
              update(
                "name",
                event.target.value,
              )
            }
            placeholder="Например, Квартира на Патриарших"
          />
        </label>

        <div className="form-grid">
          <label>
            Город

            <input
              required
              value={form.city}
              onChange={(event) =>
                update(
                  "city",
                  event.target.value,
                )
              }
              placeholder="Москва"
            />
          </label>

          <label>
            Заказчик

            <input
              required
              value={form.client}
              onChange={(event) =>
                update(
                  "client",
                  event.target.value,
                )
              }
              placeholder="Имя и фамилия"
            />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Площадь, м²

            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              value={form.area}
              onChange={(event) =>
                update(
                  "area",
                  event.target.value,
                )
              }
              placeholder="86"
            />
          </label>

          <label>
            Регион

            <select
              value={form.region}
              onChange={(event) =>
                update(
                  "region",
                  event.target.value,
                )
              }
            >
              <option>Москва</option>
              <option>
                Московская область
              </option>
              <option>
                Санкт-Петербург
              </option>
              <option>
                Ленинградская область
              </option>
              <option>
                Другой регион
              </option>
            </select>
          </label>
        </div>

        <label>
          Тип объекта

          <select
            value={form.type}
            onChange={(event) =>
              update(
                "type",
                event.target.value,
              )
            }
          >
            <option>Квартира</option>
            <option>Дом</option>
            <option>Офис</option>
            <option>
              Коммерческое помещение
            </option>
            <option>
              Капитальный ремонт
            </option>
          </select>
        </label>

        <label>
          Метод расчёта

          <select
            value={form.method}
            onChange={(event) =>
              update(
                "method",
                event.target.value,
              )
            }
          >
            <option>Ресурсный</option>
            <option>
              Базисно-индексный
            </option>
            <option>
              Ресурсно-индексный
            </option>
          </select>

          <small className="form-hint">
            Не знаете, что выбрать? Оставьте
            «Ресурсный» — ИИ подберёт всё сам.
          </small>
        </label>

        <div className="modal-footer">
          <button
            type="button"
            className="outline-button"
            onClick={onClose}
          >
            Отмена
          </button>

          <button
            className="primary-button"
            type="submit"
          >
            <Plus size={17} />
            Создать смету
          </button>
        </div>
      </form>
    </div>
  );
}

function projectTotal(
  groups: EstimateGroup[],
): number {
  return groups.reduce(
    (sum, group) =>
      sum + groupTotal(group),
    0,
  );
}

function groupTotal(
  group: EstimateGroup,
): number {
  return group.items.reduce(
    (sum, item) =>
      sum + item.qty * item.price,
    0,
  );
}

function plural(
  value: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = value % 10;
  const mod100 = value % 100;

  return mod10 === 1 && mod100 !== 11
    ? one
    : mod10 >= 2 &&
        mod10 <= 4 &&
        (mod100 < 10 || mod100 >= 20)
      ? few
      : many;
}

function exportEstimate(project: Project) {
  const rows: string[][] = [
    [
      "Категория",
      "Работа",
      "Количество",
      "Ед.",
      "Цена",
      "Сумма",
    ],
  ];

  project.estimate.forEach((group) => {
    group.items.forEach((item) => {
      rows.push([
        group.name,
        item.name,
        String(item.qty),
        item.unit,
        String(item.price),
        String(
          item.qty * item.price,
        ),
      ]);
    });
  });

  const csv = rows
    .map((row) =>
      row
        .map(
          (cell) =>
            `"${cell.replaceAll(
              '"',
              '""',
            )}"`,
        )
        .join(";"),
    )
    .join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = `${project.name
    .replaceAll(" ", "-")
    .toLowerCase()}-smeta.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function exportPdf(project: Project) {
  const rows = project.estimate
    .flatMap((group) =>
      group.items.map(
        (item) =>
          `<tr>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.unit}</td>
            <td>${money.format(
              item.qty * item.price,
            )} ₽</td>
          </tr>`,
      ),
    )
    .join("");

  const printWindow = window.open(
    "",
    "_blank",
    "width=900,height=700",
  );

  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Смета — ${project.name}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 36px;
            color: #20221f;
          }

          h1 {
            color: #4f46e5;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }

          th,
          td {
            border-bottom: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }

          th {
            background: #eef2ff;
          }
        </style>
      </head>

      <body>
        <h1>СМЕТОГРАМ</h1>

        <h2>${project.name}</h2>

        <p>
          ${project.city} · ${project.client}
        </p>

        <table>
          <thead>
            <tr>
              <th>Работа</th>
              <th>Количество</th>
              <th>Ед.</th>
              <th>Стоимость</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

function exportAct(
  project: Project,
  type: "КС-2" | "КС-3",
) {
  const total = projectTotal(
    project.estimate,
  );

  const rows = project.estimate
    .flatMap((group) =>
      group.items.map(
        (item) =>
          `${item.name};${item.qty};${item.unit};${
            item.qty * item.price
          }`,
      ),
    )
    .join("\n");

  const content = `${type}
Объект: ${project.name}
Заказчик: ${project.client}
Дата формирования: ${new Date().toLocaleDateString(
    "ru-RU",
  )}

Наименование;Количество;Ед.;Стоимость
${rows}

Итого;${total} ₽`;

  const blob = new Blob(
    ["\ufeff" + content],
    {
      type: "text/plain;charset=utf-8",
    },
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = `${type}-${project.name.replaceAll(
    " ",
    "-",
  )}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default App;