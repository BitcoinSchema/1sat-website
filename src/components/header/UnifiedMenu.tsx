"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

const UnifiedMenu: React.FC = () => {
  return (
    <SidebarTrigger className="rounded-none hover:bg-muted hover:text-primary rotate-180" />
  );
};

export default UnifiedMenu;
