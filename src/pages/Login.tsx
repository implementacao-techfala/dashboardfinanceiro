import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logoGrupoFN from "@/assets/logo-grupofn.png";
import { Lock, User, LogIn } from "lucide-react";
import { toast } from "sonner";

// Credenciais simuladas por departamento
const credentials: Record<string, { password: string; role: UserRole }> = {
  master: { password: "master123", role: "master" },
  comercial: { password: "comercial123", role: "comercial" },
  marketing: { password: "marketing123", role: "marketing" },
  financeiro: { password: "financeiro123", role: "financeiro" },
  rh: { password: "rh123", role: "rh" },
  suporte: { password: "suporte123", role: "suporte" },
};

const departmentLabels: Record<string, string> = {
  master: "Master",
  comercial: "Comercial",
  marketing: "Marketing",
  financeiro: "Financeiro",
  rh: "Recursos Humanos",
  suporte: "Suporte",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!department) {
      toast.error("Selecione um departamento");
      return;
    }
    
    if (!password) {
      toast.error("Digite a senha");
      return;
    }

    setIsLoading(true);

    // Simular delay de autenticação
    setTimeout(() => {
      const cred = credentials[department];
      
      if (cred && cred.password === password) {
        login(cred.role);
        toast.success(`Bem-vindo ao Dashboard ${departmentLabels[department]}!`);
        
        // Redirecionar baseado no role
        switch (cred.role) {
          case "rh":
            navigate("/hr");
            break;
          case "comercial":
          case "marketing":
            navigate("/clients");
            break;
          default:
            navigate("/");
        }
      } else {
        toast.error("Credenciais inválidas");
      }
      
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Premium gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at top left, #575FFF 0%, #041AAA 40%, #011AD0 75%)',
        }}
      />
      
      {/* Subtle noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Premium login card */}
      <div 
        className="relative z-10 w-full max-w-md p-8 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #2C313D 0%, #252931 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="space-y-6">
          {/* Logo container */}
          <div className="flex flex-col items-center space-y-4">
            <div 
              className="p-4 rounded-2xl"
              style={{ backgroundColor: '#041AAA' }}
            >
              <img src={logoGrupoFN} alt="Grupo FN" className="h-20 w-auto brightness-0 invert" />
            </div>
            <div className="text-center">
              <h1 
                className="text-2xl font-semibold tracking-tight"
                style={{ color: '#FFFFFF', letterSpacing: '-0.3px' }}
              >
                Dashboard Executivo
              </h1>
              <p 
                className="text-sm mt-1"
                style={{ color: '#7689FF' }}
              >
                Acesse o painel do seu departamento
              </p>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Departamento
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger 
                    id="department"
                    className="pl-10 h-12 border focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#2C313D',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#FFFFFF',
                    }}
                  >
                    <SelectValue placeholder="Selecione seu departamento" />
                  </SelectTrigger>
                  <SelectContent 
                    className="border"
                    style={{
                      backgroundColor: '#2C313D',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {Object.entries(departmentLabels).map(([key, label]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        className="focus:bg-[#575FFF]/20 focus:text-white"
                        style={{ color: '#FFFFFF' }}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-10 h-12 border transition-all focus:ring-2"
                  style={{
                    backgroundColor: '#2C313D',
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(90deg, #4141E9, #575FFF)',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px rgba(87,95,255,0.25)',
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              © {new Date().getFullYear()} Grupo FN. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
