"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { closeSnackbar, useSnackbar } from "notistack"
import Close from "@mui/icons-material/Close"
import Menu from "@mui/icons-material/Menu"
import RemoveCircle from "@mui/icons-material/RemoveCircle"
import IconButton from "@mui/material/IconButton"
import Axios from "@/lib/Axios"
import Image from "next/image"
import logo from "/public/logo.png"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, Badge, Divider, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react"
import { signOut, useSession } from "next-auth/react"
import { Books } from "@phosphor-icons/react/dist/ssr/Books"
import { Book } from "@phosphor-icons/react/dist/ssr/Book"
import { ChartDonut as ChartDonutIcon } from "@phosphor-icons/react/dist/ssr/ChartDonut"
import { UserCircleGear as UserCircleGearIcon } from "@phosphor-icons/react/dist/ssr/UserCircleGear"

// Custom NavLink component for Next.js
export const NavLink = ({ href, children, className = "", activeClassName = "", ...props }) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} className={`${className} ${isActive ? activeClassName : ""}`} {...props}>
      {children}
    </Link>
  )
}
export const Logo = () => {
  return (
    <Link href="/" className="flex-shrink-0">
      <Image
        src={logo || "/placeholder.svg"}
        alt="Logo"
        width={120}
        height={40}
        className="h-10 w-auto"
        priority
      />
    </Link>
  )
}

const Navbar = () => {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false)
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false)
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false)
  const [isMobileDashboardOpen, setIsMobileDashboardOpen] = useState(false)
  const { data: session, status } = useSession();
  const isLogin = session?.user || false

  // Close all dropdowns function
  const closeAllDropdowns = () => {
    setIsCoursesDropdownOpen(false)
    setIsDashboardDropdownOpen(false)
  }

  const toggleCoursesDropdown = () => {
    if (isDashboardDropdownOpen) setIsDashboardDropdownOpen(false)
    setIsCoursesDropdownOpen(!isCoursesDropdownOpen)
  }

  const toggleDashboardDropdown = () => {
    if (isCoursesDropdownOpen) setIsCoursesDropdownOpen(false)
    setIsDashboardDropdownOpen(!isDashboardDropdownOpen)
  }

  const router = useRouter()
  const pathname = usePathname()
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false)
    setIsMobileCoursesOpen(false)
    setIsMobileDashboardOpen(false)
    closeAllDropdowns()
    document.body.style.overflow = "auto"
  }, [pathname])

  useEffect(() => {
    // Handle body scroll when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isMobileMenuOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setIsCoursesDropdownOpen(false)
        setIsDashboardDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const showCenteredSnackbar = (message, variant) => {
    enqueueSnackbar(message, {
      variant: variant,
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      action: (
        <IconButton size="small" aria-label="close" color="inherit" onClick={() => closeSnackbar()}>
          <Close fontSize="small" />
        </IconButton>
      ),
    })
  }

  const handleMdcat = async () => {
    try {
      const response = await Axios.get("/userinfo")
      if (response?.data?.user?.isMdcat) {
        router.push("/dashboard/subject/mdcat")
      } else if (!response?.data?.user?.isMdcat) {
        showCenteredSnackbar("Checkout course to procede further !", "info")
        router.push("/checkout?course=mdcat")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      router.push("/dashboard")
      console.log(error)
    }
  }

  const handleNums = async () => {
    try {
      const response = await Axios.get("/userinfo")
      if (response?.data?.user?.isNums) {
        router.push("/dashboard/subject/nums")
      } else if (!response?.data?.user?.isNums) {
        showCenteredSnackbar("Checkout course to procede further!", "info")
        router.push("/checkout?course=nums")
      }
    } catch (error) {
      router.push("/dashboard")
      console.log(error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className=" text-lg font-semibold  top-0 z-50 py-1 "
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="flex justify-between  items-center h-16 md:h-20">
          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMobileMenu}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-primary hover:text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all duration-200 shadow-sm"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {isMobileMenuOpen ? (
                <RemoveCircle className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </motion.div>
          </motion.button>



          {/* Desktop Navigation - NO ANIMATIONS ON NAV LINKS */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex lg:items-center lg:space-x-6 lg:order-1 text-[16px] font-semibold"
          >
            <NavLink
              href="/"
              className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200"
              activeClassName="text-[#1757ab] bg-[#1757ab1a]"
            >
              Home
            </NavLink>

            <NavLink
              href="/calculator"
              className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200"
              activeClassName="text-[#1757ab] bg-[#1757ab1a]"
            >
              Aggregate Calculator
            </NavLink>

            <button
              onClick={handleNums}
              className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200"
            >
              NUMS MCQs
            </button>

            <button
              onClick={handleMdcat}
              className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200"
            >
              MDCAT MCQs
            </button>

            <Badge color="warning" size="sm" content="New" showOutline={false} shape="circle" className=" text-white" >
              <Link
                href="/series"
                className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200"
              >
                Test Series
              </Link>
            </Badge>

            {/* Courses Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={toggleCoursesDropdown}
                className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center"
              >
                Courses
                <motion.div
                  animate={{ rotate: isCoursesDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="ml-1 h-4 w-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isCoursesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 overflow-hidden"
                  >
                    <Link
                      href="/checkout?course=mdcat"
                      onClick={closeAllDropdowns}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      MDCAT
                    </Link>
                    <Link
                      href="/checkout?course=nums"
                      onClick={closeAllDropdowns}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      NUMS
                    </Link>
                    <Link
                      href="/checkout?course=mdcat%2Bnums"
                      onClick={closeAllDropdowns}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      MDCAT + NUMS
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dashboard Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={toggleDashboardDropdown}
                className="text-gray-700 hover:text-[#1757ab] px-3 py-1.5 rounded-md transition-colors duration-200 flex items-center"
              >
                Dashboard
                <motion.div
                  animate={{ rotate: isDashboardDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ChevronDown className="ml-1 h-4 w-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isDashboardDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 overflow-hidden"
                  >
                    <Link
                      href="/dashboard"
                      onClick={closeAllDropdowns}
                      className="px-4 flex items-center py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      <Book className="mr-2 h-4 w-4" /> MY COURSES
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      onClick={closeAllDropdowns}
                      className=" flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      <ChartDonutIcon className="mr-2 h-4 w-4" /> VIEW ANALYTICS
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={closeAllDropdowns}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                    >
                      <UserCircleGearIcon className="mr-2 h-4 w-4" /> PROFILE
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>


          {/* Logo - Center on mobile, left on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start  lg:order-0"
          >
            <Link href="/" className="flex-shrink-0">
              <Image
                src={logo || "/placeholder.svg"}
                alt="Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </motion.div>

          {/* Sign In/Sign Up Buttons - SUBTLE ANIMATIONS */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex lg:items-center lg:space-x-3 lg:order-2"
          >
            {!isLogin ? (
              <>
                <Link href={isLogin ? "/dashboard" : "/signin"}>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-gray-700 hover:text-[#1757ab] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-300 hover:border-[#1757ab] hover:shadow-sm"
                  >
                    Sign In
                  </motion.button>
                </Link>

                <Link href={isLogin ? "/dashboard" : "/signup"}>
                  <motion.button
                    whileHover={{
                      y: -1,
                      boxShadow: '0 4px 12px rgba(23, 87, 171, 0.2)'
                    }}
                    whileTap={{ y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#1757ab] text-white hover:bg-[#144c95] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </>
            )
              :
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform"
                    color="secondary"
                    name={session?.user?.name || "User"}
                    icon={<Books className="h-4 w-4" />}
                    size="sm"
                    src={session?.user?.image}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="">{session?.user?.email}</p>
                  </DropdownItem>
                  <DropdownItem key="help_and_feedback"><Link href={'/dashboard/profile'}>Profile Settings</Link></DropdownItem>
                  {/* <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem> */}
                  <DropdownItem key="logout" color="danger" onPress={() => signOut()}>
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            }
          </motion.div>


        </div>
      </div>

      {/* Mobile menu overlay - PROFESSIONAL MOBILE ANIMATIONS */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed h-full bg-white inset-0 z-50 lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              onClick={toggleMobileMenu}
            />
            <motion.div
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.8 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                opacity: { duration: 0.25 },
              }}
              className="fixed top-0 bg-white left-0 bottom-0 w-full max-w-sm   shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3  border-gray-200">
                <Link href="/" onClick={toggleMobileMenu}>
                  <Image
                    src={logo || "/placeholder.svg"}
                    alt="Logo"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                    priority
                  />
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Close className="h-6 w-6" />
                </motion.button>
              </div>

              <div className="px-4 py-6 space-y-1 overflow-y-auto  h-[calc(100vh-70px)]  w-full bg-white rounded-md bg-clip-padding backdrop-filter backdrop-blur-2xl bg-opacity-100 border border-gray-100">
                {/* Mobile nav items with staggered animations */}

                {[
                  { href: "/", label: "Home", delay: 0.1 },
                  { href: "/about", label: "About", delay: 0.1 },
                  { href: "/contact", label: "Contact Us", delay: 0.1 },
                  { href: "/calculator", label: "Aggregate Calculator", delay: 0.15 },
                ].map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item.delay, duration: 0.3 }}
                  >
                    <NavLink
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                      activeClassName="text-primary  bg-priamry-50"
                      onClick={toggleMobileMenu}
                    >
                      {item.label}
                    </NavLink>
                  </motion.div>
                ))}

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  onClick={() => {
                    handleNums()
                    toggleMobileMenu()
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  NUMS Bank
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  onClick={() => {
                    handleMdcat()
                    toggleMobileMenu()
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  MDCAT MCQs
                </motion.button>

                <Badge color="warning" size="sm" content="New" showOutline={false} shape="circle" className=" text-white" >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    <NavLink
                      href={'/series'}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                      activeClassName="text-primary  bg-priamry-50"
                      onClick={toggleMobileMenu}
                    >
                      Test Series
                    </NavLink>
                  </motion.div>
                </Badge>

                {/* Mobile Courses Dropdown */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <button
                    onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Courses
                    <motion.div
                      animate={{ rotate: isMobileCoursesOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isMobileCoursesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="ml-4 mt-1 space-y-1 overflow-hidden"
                      >
                        <Link
                          href="/checkout?course=mdcat"
                          className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                          onClick={toggleMobileMenu}
                        >
                          MDCAT
                        </Link>
                        <Link
                          href="/checkout?course=nums"
                          className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                          onClick={toggleMobileMenu}
                        >
                          NUMS
                        </Link>
                        <Link
                          href="/checkout?course=mdcat%2Bnums"
                          className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                          onClick={toggleMobileMenu}
                        >
                          MDCAT + NUMS
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                  >
                  </motion.div>
                </motion.div>



                {/* Mobile Dashboard Dropdown */}
                <div className="mt-10">
                  <Divider className="my-2" />
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <button
                      onClick={toggleDashboardDropdown}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Dashboard
                      <motion.div
                        animate={{ rotate: isDashboardDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {
                        isDashboardDropdownOpen &&
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="ml-4 mt-1 space-y-1 overflow-hidden"
                        >
                          <Link
                            href="/dashboard"
                            onClick={closeAllDropdowns}
                            className="px-4 flex items-center py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                          >
                            <Book className="mr-2 h-4 w-4" /> MY COURSES
                          </Link>
                          <Link
                            href="/dashboard/analytics"
                            onClick={closeAllDropdowns}
                            className=" flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                          >
                            <ChartDonutIcon className="mr-2 h-4 w-4" /> VIEW ANALYTICS
                          </Link>
                          <Link
                            href="/dashboard/profile"
                            onClick={closeAllDropdowns}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f6fd] hover:text-[#1757ab] transition-colors duration-150"
                          >
                            <UserCircleGearIcon className="mr-2 h-4 w-4" /> PROFILE
                          </Link>
                        </motion.div>
                      }
                    </AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35, duration: 0.3 }}
                    >
                    </motion.div>
                  </motion.div>



                  {/* Mobile Sign In/Sign Up Buttons */}
                  {
                    !isLogin ?
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="pt-4 border-t gap-1 flex flex-col border-gray-200 mt-4 space-y-2"
                      >
                        <Link href={'/signin'}>
                          <button className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 border border-gray-300">
                            Sign In
                          </button>
                        </Link>
                        <Link href={'/signup'}>
                          <button className="block w-full text-center px-4 py-2.5 rounded-lg text-base font-medium text-white bg-primary hover:bg-primary-700 transition-colors duration-200 shadow-sm">
                            Sign Up
                          </button>
                        </Link>
                      </motion.div>
                      :
                      <button onClick={() => signOut()} className="block mt-8 bg-rose-400 text-white w-full text-center px-4 py-2.5 rounded-lg text-base font-medium text-g700ray- hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200 border ">
                        Sign Out
                      </button>
                  }
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
