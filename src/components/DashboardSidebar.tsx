import { LayoutDashboard, TrendingUp, Users, Target, DollarSign, Menu, UserCheck, BarChart3, Package, Tv, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logoGrupoFN from "@/assets/logo-grupofn.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Visão Executiva", url: "/", icon: LayoutDashboard, page: "overview" },
  { title: "Clientes & Retenção", url: "/clients", icon: UserCheck, page: "clients" },
  { title: "Comercial & Vendas", url: "/sales", icon: BarChart3, page: "sales" },
  { title: "Margem por Serviço", url: "/services", icon: Package, page: "services" },
  { title: "Marketing & ROI", url: "/marketing", icon: Target, page: "marketing" },
  { title: "Financeiro & DRE", url: "/financial", icon: TrendingUp, page: "financial" },
  { title: "Fluxo de Caixa", url: "/cashflow", icon: DollarSign, page: "cashflow" },
  { title: "Recursos Humanos", url: "/hr", icon: Users, page: "hr" },
];

export function DashboardSidebar() {
  const { open } = useSidebar();
  const { user, logout, canAccess } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredMenuItems = menuItems.filter(item => canAccess(item.page));

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r"
      style={{
        background: 'linear-gradient(180deg, #1a1d24 0%, #13151a 100%)',
        borderColor: 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo header */}
      <div 
        className="flex items-center justify-between p-5"
        style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(135deg, #041AAA 0%, #011AD0 100%)',
        }}
      >
        {open && (
          <img src={logoGrupoFN} alt="Grupo FN" className="h-20 w-auto brightness-0 invert" />
        )}
        <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10 transition-colors">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      {/* User info */}
      {open && user && (
        <div 
          className="px-5 py-4"
          style={{ 
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(65,65,233,0.08)',
          }}
        >
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(118,137,255,0.7)' }}>Logado como</p>
          <p className="text-sm font-semibold text-white mt-1">{user.name}</p>
        </div>
      )}

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel 
            className="text-[11px] uppercase tracking-wider mb-3 px-3"
            style={{ color: 'rgba(118,137,255,0.6)' }}
          >
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-white font-medium"
                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
                        }`
                      }
                      style={({ isActive }) => 
                        isActive 
                          ? { background: 'linear-gradient(90deg, rgba(65,65,233,0.3) 0%, rgba(87,95,255,0.15) 100%)' }
                          : {}
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active indicator bar */}
                          {isActive && (
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                              style={{ background: 'linear-gradient(180deg, #575FFF 0%, #4141E9 100%)' }}
                            />
                          )}
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-[#7689FF]' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
                          {open && <span>{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canAccess("tv") && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel 
              className="text-[11px] uppercase tracking-wider mb-3 px-3"
              style={{ color: 'rgba(118,137,255,0.6)' }}
            >
              Visualização
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/tv"
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-white font-medium"
                            : "text-white/60 hover:text-white/90 hover:bg-white/5"
                        }`
                      }
                      style={({ isActive }) => 
                        isActive 
                          ? { background: 'linear-gradient(90deg, rgba(65,65,233,0.3) 0%, rgba(87,95,255,0.15) 100%)' }
                          : {}
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div 
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                              style={{ background: 'linear-gradient(180deg, #575FFF 0%, #4141E9 100%)' }}
                            />
                          )}
                          <Tv className={`h-5 w-5 ${isActive ? 'text-[#7689FF]' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
                          {open && <span>Modo TV</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <SidebarGroup className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.8} />
                    {open && <span>Sair</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
