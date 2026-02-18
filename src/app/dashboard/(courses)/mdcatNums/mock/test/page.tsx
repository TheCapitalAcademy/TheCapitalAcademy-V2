"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardBody, Button } from "@heroui/react"
import { motion } from "framer-motion"
import Image from "next/image"

const mockOptions = [
  {
    id: "mdcat",
    title: "MDCAT Mock Test",
    description: "180 MCQs based on MDCAT pattern",
    image: "/courses/1.jpg",
    gradient: "from-sky-500 to-indigo-500",
    bgGradient: "from-sky-50 to-indigo-50",
    course: "mdcat",
  },
  {
    id: "nums",
    title: "NUMS Mock Test",
    description: "150 MCQs based on NUMS pattern",
    image: "/courses/2.jpg",
    gradient: "from-rose-500 to-fuchsia-500",
    bgGradient: "from-rose-50 to-pink-50",
    course: "nums",
  },
]

export default function MockTestSelection() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (courseId: string) => {
    setSelected(courseId)
    // Navigate to the actual mock test page using the underlying course
    router.push(
      `/solve-mcq?course=${courseId}&subject=mock&chapter=test&topic=Mock+Test&category=unsolved`
    )
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center md:p-4">
      <div className="flex justify-center pb-4">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple to-pink bg-clip-text text-transparent">
          CHOOSE YOUR MOCK TEST
        </h1>
      </div>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-lg">
        Select which exam pattern you&apos;d like to practice. Each mock test follows the official format of the respective exam.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4">
        {mockOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              isPressable
              onPress={() => handleSelect(option.course)}
              className={`shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                selected === option.id ? "border-purple-500" : "border-transparent"
              }`}
            >
              <CardBody className="p-0">
                <div className={`h-32 bg-gradient-to-br ${option.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">{option.title}</h2>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-600">{option.description}</p>
                  <Button
                    color="primary"
                    className={`w-full bg-gradient-to-r ${option.gradient} text-white font-medium`}
                    isLoading={selected === option.id}
                    onPress={() => handleSelect(option.course)}
                  >
                    Start {option.title}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
