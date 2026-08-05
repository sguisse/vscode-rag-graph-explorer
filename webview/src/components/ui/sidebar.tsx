import * as React from "react"
import { cn } from "../../lib/utils"

export const SidebarProvider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-full w-full", className)} {...props} />
))
SidebarProvider.displayName = "SidebarProvider"

export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { width?: string }>(({ className, style, width, ...props }, ref) => (
  <aside ref={ref} style={{ width, ...style }} className={cn("z-10 relative flex flex-col bg-sidebar border-sidebar-border border-r h-full transition-all duration-150 shrink-0", className)} {...props} />
))
Sidebar.displayName = "Sidebar"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col flex-1 gap-1 px-2 py-3 overflow-x-hidden overflow-y-auto scrollbar-hide", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
))
SidebarGroup.displayName = "SidebarGroup"

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-col gap-1 list-none p-0 m-0", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("block", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }>(({ className, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "w-full flex items-center rounded-md text-xs font-medium px-3 py-2 transition-all duration-150 select-none cursor-pointer outline-none",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      className
    )}
    {...props}
  />
))
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarMenuBadge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ className, ...props }, ref) => (
  <span ref={ref} className={cn("ml-auto bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold text-[10px]", className)} {...props} />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex p-2 border-sidebar-border border-t mt-auto", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"
