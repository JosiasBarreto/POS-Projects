import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  History,
  Store as StoreIcon,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RotateCcw,
  FileText,
  Bell,
  Check,
} from "lucide-react";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  const { user, logout, store, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  React.useEffect(() => {
    if (user?.role === "admin" || user?.role === "supervisor") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Painel",
      icon: LayoutDashboard,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "pos",
      label: "Vendas (POS)",
      icon: ShoppingCart,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "sales",
      label: "Histórico de Vendas",
      icon: Receipt,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "proformas",
      label: "Faturas Proforma",
      icon: FileText,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "post-sale",
      label: "Pós-Venda / Devoluções",
      icon: RotateCcw,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "inventory",
      label: "Stock",
      icon: Package,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Users,
      roles: ["admin", "supervisor", "cashier"],
    },
    {
      id: "users",
      label: "Funcionários",
      icon: Users,
      roles: ["admin", "supervisor"],
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: BarChart3,
      roles: ["admin", "supervisor"],
    },
    {
      id: "audit",
      label: "Consola Auditoria",
      icon: History,
      roles: ["admin"],
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  const handleLogout = () => {
    if (session) {
      toast.error(
        "Não é possível sair com o caixa aberto. Por favor, feche o caixa primeiro.",
        {
          description:
            "Segurança: O fecho de caixa é obrigatório antes de terminar a sessão.",
          duration: 5000,
        }
      );
      return;
    }
    logout();
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-[#e5e5e5] flex flex-col transition-all duration-300 relative",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-[#e5e5e5] rounded-full flex items-center justify-center text-muted-foreground hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors z-10 shadow-sm"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        <div className="p-6 border-bottom border-[#e5e5e5] flex items-center justify-center">
          <div
            className={cn(
              "flex items-center gap-3",
              isSidebarOpen ? "w-full" : "justify-center"
            )}
          >
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-white shrink-0">
              <StoreIcon size={24} />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg leading-tight truncate">
                  {store?.name || "Sistema POS"}
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  São Tomé e Príncipe
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={!isSidebarOpen ? item.label : undefined}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200",
                isSidebarOpen ? "gap-3" : "justify-center",
                activeTab === item.id
                  ? "bg-[#1a1a1a] text-white shadow-lg shadow-black/10"
                  : "text-[#666] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </button>
          ))}
          {/* Header with Notifications */}
          <div className="flex justify-end mb-6">
            {(user?.role === "admin" || user?.role === "supervisor") && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-3 bg-white border border-[#e5e5e5] rounded-2xl text-muted-foreground hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all relative group"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e5e5e5] rounded-3xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-[#f5f5f5] flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-sm">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <Bell
                              size={32}
                              className="mx-auto mb-2 opacity-20"
                            />
                            <p className="text-xs">
                              Sem notificações no momento.
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "p-4 border-b border-[#f5f5f5] last:border-0 transition-colors",
                                !n.is_read
                                  ? "bg-indigo-50/30"
                                  : "hover:bg-slate-50"
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="font-bold text-xs text-indigo-600">
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <button
                                    onClick={() => markAsRead(n.id)}
                                    className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"
                                    title="Marcar como lida"
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-2 block">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-[#e5e5e5]">
          <div
            className={cn(
              "flex items-center mb-2",
              isSidebarOpen ? "gap-3 px-4 py-3" : "justify-center py-3"
            )}
          >
            <div className="w-8 h-8 bg-[#f0f0f0] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-[#999] capitalize truncate">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={!isSidebarOpen ? "Sair" : undefined}
            className={cn(
              "w-full flex items-center px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors",
              isSidebarOpen ? "gap-3" : "justify-center"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 relative">{children}</main>
    </div>
  );
};

export default Layout;
