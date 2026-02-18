"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  Calendar,
  Bookmark,
  GraduationCap,
  User,
  Home,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  Users,
  FileText,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { easeInOut } from "framer-motion"
import { Avatar, Button } from "@heroui/react"
import { signOut, useSession } from "next-auth/react"
import { Logo } from "@/components/common/navbar/Navbar"
import clsx from "clsx"

const menuItems = [
  {
    text: "My Courses",
    icon: GraduationCap,
    path: "/dashboard",
    description: "Learning paths",
  },
  {
    text: "Saved MCQ's",
    icon: Bookmark,
    path: "/dashboard/saved",
    description: "Saved content",
  },
  {
    text: "Capy AI",
    icon: Sparkles,
    path: "/dashboard/ai-settings",
    description: "AI Assistant",
  },
    {
    text: "Schedule Maker",
    icon: Calendar,
    path: "/dashboard/planner",
    description: "Manage calendar",
  },
  
  {
    text: "Performance Analyzer",
    icon: BarChart3,
    path: "/dashboard/analytics",
    description: "User MCQ Progress Stats",
  },

  {
    text: "Test Series",
    icon: Users,
    path: "/dashboard/series",
    description: "Student management",
    hasSubmenu: true,
    submenu: [
      {
        text: "My Series",
        icon: FileText,
        path: "/dashboard/series",
        description: "Student assessments",
      },
      {
        text: "View Stats",
        icon: TrendingUp,
        path: "/dashboard/series/stats",
        description: "Student performance",
      },
      {
        text: "View Schedule",
        icon: Calendar,
        path: "/dashboard/series/schedule",
        description: "Schedule",
      },
    ],
  },
  
  {
    text: "Profile",
    icon: User,
    path: "/dashboard/profile",
    description: "Profile",
  },
  {
    text: "Subscriptions",
    icon: Bell,
    path: "/dashboard/subscriptions",
    description: "Subscriptions",
  },
  
  
]

const sidebarVariants = {
  expanded: {
    width: 280,
    transition: {
      duration: 0.4,
      ease: easeInOut,
    },
  },
  collapsed: {
    width: 72,
    transition: {
      duration: 0.4,
      ease: easeInOut,
    },
  },
}

const mobileMenuVariants = {
  hidden: {
    x: "-100%",
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
}

const iconVariants = {
  rest: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.2 },
  },
  hover: {
    scale: 1.1,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
}

const menuItemVariants = {
  rest: {
    x: 0,
    transition: { duration: 0.2 },
  },
  hover: {
    x: 6,
    transition: { duration: 0.2 },
  },
}

const submenuVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
}

const submenuItemVariants = {
  hidden: {
    x: -10,
    opacity: 0,
  },
  visible: (index: number) => ({
    x: 0,
    opacity: 1
  }),
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const { data: session } = useSession()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMenuOpen(false)
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  const getPageTitle = () => {
    for (const item of menuItems) {
      if (item.submenu) {
        const submenuItem = item.submenu.find((sub) => isActive(sub.path))
        if (submenuItem) return submenuItem.text
      }
    }
    const currentItem = menuItems.find((item) => isActive(item.path))
    return currentItem?.text || "Dashboard"
  }

  const toggleSubmenu = (menuText: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuText) ? prev.filter((item) => item !== menuText) : [...prev, menuText],
    )
  }

  const renderMenuItem = (item: any, index: number, isMobile = false) => {
    const hasSubmenu = item.hasSubmenu && item.submenu
    const isExpanded = expandedMenus.includes(item.text)
    const isParentActive = hasSubmenu && item.submenu.some((sub: any) => isActive(sub.path))

    return (
      <motion.div
        key={item.text}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
      >
        <motion.button
          variants={menuItemVariants}
          initial="rest"
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.text)
            } else {
              handleNavigation(item.path)
            }
          }}
          className={`w-full rounded-xl flex items-center gap-3 bg-sidebar-border xl:gap-4 px-3 xl:px-4 py-3 xl:py-3.5 text-small text-sidebar-primary  text-left transition-all duration-200 backdrop-blur-sm relative overflow-hidden group ${isActive(item.path) || isParentActive
              ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 shadow-sm"
              : "text-slate-700 bg-gray-100 hover:backdrop-blur-xl shadow-sm"
            } ${sidebarCollapsed && !isMobile ? "justify-center px-2" : ""}`}
        >
          {(isActive(item.path) || isParentActive) && (
            <motion.div
              layoutId={isMobile ? "mobileActiveIndicator" : "activeIndicator"}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <motion.div variants={iconVariants} initial="rest" whileHover="hover" className="relative z-10 flex-shrink-0">
            <item.icon className="w-5 h-5" />
          </motion.div>
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 relative z-10"
              >
                <span className="font-medium block">{item.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {hasSubmenu && (!sidebarCollapsed || isMobile) && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}

        </motion.button>

        {hasSubmenu && (!sidebarCollapsed || isMobile) && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={submenuVariants}
                className="overflow-hidden"
              >
                <div className="ml-2  border-l-1  pl-1 mt-1 space-y-1.5">
                  {item.submenu.map((subItem: any, subIndex: number) => {
                    const active = isActive(subItem.path)

                    return (
                      <motion.button
                        key={subItem.text}
                        custom={subIndex}
                        variants={submenuItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={() => handleNavigation(subItem.path)}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-200 relative overflow-hidden group",
                          active
                            ? "bg-gradient-to-r from-blue-400/30 to-indigo-400/30 text-blue-800 shadow-lg border border-blue-300/60 backdrop-blur-xl"
                            : "text-slate-600 bg-gray-100 h border border-transparent"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId={isMobile ? "mobileSubmenuActiveIndicator" : "submenuActiveIndicator"}
                            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-lg backdrop-blur-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <motion.div
                          variants={iconVariants}
                          initial="rest"
                          whileHover="hover"
                          className="relative z-10 flex-shrink-0"
                        >
                          <subItem.icon className="w-4 h-4" />
                        </motion.div>

                        <span className="flex-1 min-w-0 relative z-10 font-medium text-sm">
                          {subItem.text}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </motion.div>
    )
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="lg:hidden backdrop-blur-2xl bg-white/80 border-b border-white/30 shadow-sm relative z-50 sticky top-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <motion.button
              variants={iconVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 backdrop-blur-sm transition-all duration-200 touch-manipulation"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <div className="flex-1 min-w-0">
              <motion.h1
                key={getPageTitle()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-semibold text-base sm:text-lg text-slate-800 truncate"
              >
                {getPageTitle()}
              </motion.h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              variants={iconVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => router.push("/")}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 backdrop-blur-sm transition-all duration-200 touch-manipulation"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <Avatar size="sm" src={session?.user?.image} alt={session?.user?.name} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 backdrop-blur-md bg-black/20"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={mobileMenuVariants}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm backdrop-blur-2xl bg-white/90 border-r border-white/30 shadow-sm"
            >
              <div className="p-6 border-b border-white/30">
                <div className="flex items-center gap-3 justify-between">
                  <div className="w-10 h-10  flex items-center justify-center shadow-sm">
                    <Logo />
                  </div>
                  <div>
                    <Button onPress={() => setIsMenuOpen(false)} size="sm" isIconOnly>
                      <X />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-5">
                <div className="px-6 space-y-3">
                  {menuItems.map((item, index) => renderMenuItem(item, index, true))}
                </div>
              </div>

              <div className="p-6 border-t border-white/30 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 bg-rose-400 text-white px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 backdrop-blur-sm transition-all duration-200 touch-manipulation"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        <motion.aside
          variants={sidebarVariants}
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
          className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 backdrop-blur-2xl bg-white/70 border-r border-gray-200 shadow-sm z-30"
        >
          <motion.div layout className="p-4 xl:p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 xl:w-9 xl:h-9   flex items-center justify-center">
                      <Logo />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                variants={iconVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 xl:p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 backdrop-blur-sm transition-all duration-200"
              >
                <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <Menu className="w-4 h-4" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>

          <div className="flex-1 overflow-y-auto py-4 xl:py-6">
            <nav className="px-3 xl:px-4 space-y-1 xl:space-y-2">
              {menuItems.map((item, index) => renderMenuItem(item, index, false))}
            </nav>
          </div>
        </motion.aside>

        <div
          className={`flex-1 w-full overflow-hidden transition-all duration-400 ${sidebarCollapsed ? "lg:ml-18" : "lg:ml-70"} min-h-screen`}
          style={{
            marginLeft: isMobile ? 0 : sidebarCollapsed ? "72px" : "280px",
          }}
        >
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="hidden lg:flex lg:items-center lg:justify-between px-6 xl:px-8 py-4 xl:py-6 backdrop-blur-2xl bg-white/60 border-b border-white/30 shadow-sm sticky top-0 z-20"
          >
            <div className="flex-1 min-w-0">
              {/* <motion.h1
                key={getPageTitle()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl xl:text-2xl font-bold text-slate-800"
              >
                {getPageTitle()}
              </motion.h1> */}
            </div>
            <div className="flex items-center gap-3 xl:gap-4 flex-shrink-0">
              <motion.button
                variants={iconVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-4 xl:px-5 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 backdrop-blur-sm transition-all duration-200 border border-white/40 shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Home</span>
              </motion.button>
              <div className="w-px h-6 xl:h-8 bg-slate-300/50"></div>
              <Avatar src={session?.user?.image} alt={session?.user?.name} />
            </div>
          </motion.header>

          <div className="container my-4 bg-gray-50  border border-white/30 shadow-sm min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-12rem)] relative overflow-hidden">
            <div className="relative z-10 p-0 sm:p-0 lg:p-6 xl:p-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
