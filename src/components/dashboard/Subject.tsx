"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { Card, CardBody } from "@heroui/react"
import Link from "next/link"

interface SubjectProps {
  name: string
  img: string
  link: string
  isLocked?: boolean
}

const Subject = memo<SubjectProps>(({ name, img, link, isLocked = false }) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20},
    animate: { opacity: 1, y: 0 },
    hover: {
      scale: 1.01,
      transition: { duration: 0.2 },
    },
  }

  const imageVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1 },
    hover: { scale: 1.021 },
  }

  return (
    <div className="max-w-sm w-[47%] md:w-1/3  rounded-3xl">
      <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="hover" className="h-full">
        <Link
          href={isLocked ? "#" : link}
          className={`block h-full ${isLocked ? "pointer-events-none" : ""}`}
          aria-label={isLocked ? `${name} - Locked` : `Go to ${name}`}
        >
          <Card
            className={`h-full transition-all rounded-3xl  duration-300 ${
              isLocked ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl cursor-pointer"
            }`}
          >
            <CardBody className="p-0">
              <div className="relative aspect-video overflow-hidden p-0">
                <motion.img
                  src={img}
                  alt={name}
                  variants={imageVariants}
                  className="w-full h-full object-cover p-0"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder-subject.jpg" // Fallback image
                  }}
                />

                {isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Lock size={24} className="text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 text-center">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{name}</h3>
                {isLocked && <p className="text-sm text-gray-500 mt-1">Unlock to access</p>}
              </div>
            </CardBody>
          </Card>
        </Link>
      </motion.div>
    </div>
  )
})

Subject.displayName = "Subject"

export default Subject
