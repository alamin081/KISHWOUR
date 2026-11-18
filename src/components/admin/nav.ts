import {
  Boxes,
  FileText,
  FlaskConical,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  type LucideIcon,
  PenSquare,
  Store,
  Users,
} from "lucide-react";

import { type Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
};

export const adminNav: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Boxes,
    permission: "products:manage",
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    permission: "categories:manage",
  },
  {
    title: "Inquiries",
    href: "/admin/inquiries",
    icon: Inbox,
    permission: "inquiries:manage",
  },
  {
    title: "Sample requests",
    href: "/admin/samples",
    icon: FlaskConical,
    permission: "inquiries:manage",
  },
  {
    title: "Quotations",
    href: "/admin/quotations",
    icon: FileText,
    permission: "quotations:manage",
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
    permission: "customers:view",
  },
  { title: "Alibaba", href: "/admin/alibaba", icon: Store, permission: "alibaba:manage" },
  {
    title: "Pages",
    href: "/admin/pages",
    icon: LayoutTemplate,
    permission: "content:manage",
  },
  {
    title: "Content",
    href: "/admin/content",
    icon: PenSquare,
    permission: "content:manage",
  },
];
