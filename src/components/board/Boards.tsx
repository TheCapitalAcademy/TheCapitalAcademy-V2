"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"

// Import board images
import img1 from "/public/boards/img1.png"
import img2 from "/public/boards/img2.png"
import img3 from "/public/boards/img3.png"
import img4 from "/public/boards/img4.jpg"
import img5 from "/public/boards/img5.png"
import img6 from "/public/boards/img6.png"

const Boards = () => {
  // Board data with additional metadata
  const boardData = [
    { src: img1, title: "BUMHS", description: "Bolan University of Medical & Health Sciences" },
    { src: img2, title: "FMDC", description: "The Federal Medical And Dental College" },
    { src: img3, title: "ETEA", description: "Educational Testing and Evaluation Agency" },
    { src: img4, title: "NUMS ", description: "National University Of Medical Sciences" },
    { src: img5, title: "DUHS", description: "Dow University of Health Sciences" },
    { src: img6, title: "UHS", description: "University of Health Sciences" },
  ]

  // Use useInView to detect when the component is in view
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.4,
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20" ref={ref}>
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Best For
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Every Need
            </span>
          </motion.h2>


          {/* Decorative Line */}
          <motion.div
            className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-8 rounded-full"
            initial={{ width: 0 }}
            animate={inView ? { width: 128 } : { width: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </div>

        {/* Boards Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-2 md:gap-6 lg:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {boardData.map((board, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group cursor-pointer"
              whileHover={{
                y: -12,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative overflow-hidden rounded-xl md:rounded-3xl bg-white shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-gray-100">
                {/* Image Container */}
                <div className="relative aspect-[5/3] overflow-hidden">
                  <Image
                    src={board.src || "/placeholder.svg"}
                    alt={board.title}
                    fill
                    className="object-contain object-center transition-transform duration-700"
                    sizes="(max-width: 340px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 3} // Prioritize first 3 images
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>

                {/* Card Footer */}
                <div className="p-3 md:-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {board.title}
                      </h3>
                      <p className="text-gray-600 text-sm/2 mt-1 line-clamp-2">{board.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
        </motion.div>
      </div>
    </section>
  )
}

export default Boards
