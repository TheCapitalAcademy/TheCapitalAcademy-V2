"use client"

import { useState, useEffect } from "react"
import { redirect, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Trophy, Star, BookOpen } from "lucide-react"
import { UnifiedAnimation } from "./animation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LightningIcon } from "@phosphor-icons/react/dist/ssr"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import Axios from "@/lib/Axios"

interface User {
  isMdcat?: boolean
  isNums?: boolean
  isMdcatNums?: boolean
  isTrialActive?: boolean
}

interface HeaderProps {
  isActiveCourse?: boolean
}

const Header = ({ isActiveCourse }: HeaderProps) => {
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();
  const user = session?.user || null;


  const router = useRouter()
  const texts = ["MDCAT", "NUMS"]

  // Intersection observer for entrance animations
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  // Simplified typing animation
  useEffect(() => {
    const typeEffect = () => {
      const currentFullText = texts[textIndex]

      if (isDeleting) {
        setCurrentText(currentFullText.substring(0, charIndex - 1))
        setCharIndex((prev) => prev - 1)
      } else {
        setCurrentText(currentFullText.substring(0, charIndex + 1))
        setCharIndex((prev) => prev + 1)
      }

      if (!isDeleting && charIndex === currentFullText.length) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false)
        setTextIndex((prevIndex) => (prevIndex + 1) % texts.length)
      }
    }

    const timer = setTimeout(typeEffect, isDeleting ? 75 : 150)
    return () => clearTimeout(timer)
  }, [currentText, isDeleting, textIndex, charIndex, texts])

  const handleFreeTrial = async () => {
    try {
      if (isActiveCourse) {
        return;
      }
      setLoading(true)
      if (!session.user) {
        toast.error("Please sign in to start your free trial.")
        return redirect('/signin')
      }
      const res = await Axios.post('/api/v1/purchase/trial')
      if (res.status !== 200) {
        throw new Error("Failed to activate trial")
      }
      toast.success("3-day trial activated successfully! Start exploring all subjects now.");
      setShowSuccessModal(true);
      setLoading(false)
    } catch (error) {
      toast.error("Failed to activate trial. Please try again later.")
      setShowSuccessModal(false)
      setLoading(false)
      console.error("Trial activation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasActiveSubscription = user?.isMdcat || user?.isNums || user?.isMdcatNums || user?.isTrialActive

  // Simplified animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <>
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        {/* Simplified background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-4 md:py-2" ref={ref}>
          <div
            className="flex flex-col lg:flex-row items-center min-h-[90vh] gap-8"
          >
            {/* Left Content - Takes up left side */}
            <div className="flex-1 space-y-8 max-w-2xl">
              {/* Offer Badge */}
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border shadow-sm bg-gradient-to-r from-[#d9e9fb] to-[#fce4f0] border-[#c8d8f0]"
              >
                <Sparkles className="w-5 h-5 text-[#1757ab]" />
                <span className="text-[#1757ab] font-semibold tracking-tight">
                  🎉 75% OFF Ramadan Offer 🌙
                </span>
              </motion.div>


              {/* Main Heading */}
              <motion.div variants={fadeInUp} className="space-y-6">
                <h1 className="text-5xl md:text-5xl lg:text-7xl font-bold leading-tight text-neutral-800 dark:text-white">
                  Boost Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#e260a2] relative">
                    {currentText}
                    <span
                      className="text-primary overflow-hidden py-2 box-border h-[90%]"
                    >
                      |
                    </span>
                  </span>
                  <br />
                  Prep With{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e260a2] to-[#eb276d]">
                    The Capital Academy
                  </span>
                </h1>
              </motion.div>


              {/* Stats */}
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 md:gap-6">
                {[
                  { icon: Trophy, label: "10K+ Students", color: "#1757ab" },
                  { icon: Star, label: "4.9/5 Rating", color: "#e260a2" },
                  { icon: BookOpen, label: "40K+ MCQs", color: "#eb276d" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-white/10 backdrop-blur-lg rounded-2xl shadow-md border border-gray-200 dark:border-white/10 transition-all hover:scale-[1.02]"
                  >
                    <stat.icon className="w-4 h-4 md:w-6 md:h-6" style={{ color: stat.color }} />
                    <span className="text-gray-800 dark:text-white font-semibold text-sm md:text-base">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>


              {/* CTA Button */}
              {!hasActiveSubscription && (
                <motion.div variants={fadeInUp}>
                  <Button
                    onClick={handleFreeTrial}
                    disabled={loading}
                    size="lg"
                    className={cn(
                      "relative inline-flex items-center justify-center px-10 py-6 text-xl font-semibold rounded-2xl transition-all duration-300 group",
                      "bg-gradient-to-r from-[#1757ab] to-[#e260a2] text-white shadow-xl",
                      "hover:from-[#154c95] hover:to-[#cc4f90]",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Activating Magic...
                      </>
                    ) : isActiveCourse ?
                      <Link href="/dashboard">
                        Resume Course
                        <motion.span
                          className="ml-3 inline-block text-2xl group-hover:translate-x-1 transition-transform"
                          animate={{ x: [0, 6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <LightningIcon className="inline-block h-6 w-6" />
                        </motion.span>
                      </Link>
                      :
                      <>
                        Start Free Trial
                        <motion.span
                          className="ml-3 inline-block text-2xl group-hover:translate-x-1 transition-transform"
                          animate={{ x: [0, 6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          →
                        </motion.span>
                      </>
                    }
                  </Button>
                </motion.div>
              )}

            </div>

            {/* Right Animation - Takes up full right side */}
            <motion.div variants={fadeInUp} className="hidden md:flex flex-1 w-full h-full">
              <UnifiedAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#e9f2fb] rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.svg
                  className="w-8 h-8 text-[#1757ab]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>

              <h3 className="text-2xl font-bold text-[#1757ab] mb-2">Success! 🎉</h3>
              <p className="text-gray-600 mb-6">
                3-day trial activated successfully! Start exploring all subjects now.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/dashboard");
                  }}
                  className="w-full bg-gradient-to-r from-[#1757ab] to-[#e260a2] hover:from-[#144c93] hover:to-[#c95090] text-white font-semibold shadow-md transition-all duration-300"
                >
                  Start Learning Now 🚀
                </Button>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  variant="outline"
                  className="w-full border-[#1757ab] text-primary"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}

export default Header
