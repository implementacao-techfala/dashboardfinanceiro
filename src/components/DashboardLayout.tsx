import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  isInitialLoad?: boolean;
}

export const DashboardLayout = ({ children, isInitialLoad = false }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-background ${isInitialLoad ? 'animate-initial-fade-in' : ''}`}>
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
