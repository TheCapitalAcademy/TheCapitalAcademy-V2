"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import Image from "next/image"

// Types
interface CourseItem {
    _id: string
    cname: string
    cdesc: string
    cprice: number
    cdiscount: number
}

interface CourseData {
    mdcat: {
        description: string
        price: number
        discount: number
    }
    nums: {
        description: string
        price: number
        discount: number
    }
    "mdcat+nums": {
        description: string
        price: number
        discount: number
    }
}

const Pricing = () => {
    const [courseData, setCourseData] = useState<CourseData>({
        mdcat: { description: "", price: 0, discount: 0 },
        nums: { description: "", price: 0, discount: 0 },
        "mdcat+nums": { description: "", price: 0, discount: 0 },
    })
    const [loading, setLoading] = useState(true)

    // Intersection observer for animations
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.3,
    })

    // Course configuration
    const courses = [
        {
            id: "mdcat",
            title: "MDCAT Pro Prep",
            subtitle: "Medical College Admission Test",
            image: "/courses/1.jpg",
            gradient: "from-sky-500 via-indigo-500 to-blue-500",
            bgGradient: "from-sky-50 to-indigo-50",
            shadowColor: "shadow-sky-400/40",
            link: "/checkout?course=mdcat",
            badge: "Most Popular",
            badgeColor: "bg-indigo-600",
            features: [
                "Valid Till Exam",
                "QBank With 40000+ MCQs",
                "One Click Explanations",
                "Capy AI (New)",
                "Unlimited Mock Tests",
                "Syllabus tracker and schedule maker",
                "Performance analysis",
                "Mentorship & Guidance",
            ],
        },
        {
            id: "nums",
            title: "NUMS Mastery",
            subtitle: "National University Medical Sciences",
            image: "/courses/2.jpg",
            gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
            bgGradient: "from-rose-50 to-pink-50",
            shadowColor: "shadow-pink-400/30",
            link: "/checkout?course=nums",
            badge: "Updated 2024",
            badgeColor: "bg-fuchsia-600",
            features: [
                                "Valid Till Exam",
                "QBank With 35000+ MCQs",
                "One Click Explanations",
                "Capy AI (New)",
                "Unlimited Mock Tests",
                "Syllabus tracker and schedule maker",
                "Performance analysis",
                "Mentorship & Guidance",
            ],
        },
        {
            id: "mdcat+nums",
            title: "Advanced MDCAT + NUMS",
            subtitle: "Complete Medical Entrance Package",
            image: "/courses/3.jpg",
            gradient: "from-emerald-500 via-teal-500 to-lime-400",
            bgGradient: "from-emerald-50 to-lime-50",
            shadowColor: "shadow-emerald-400/30",
            link: "/checkout?course=mdcat%2Bnums",
            badge: "Best Value",
            badgeColor: "bg-teal-600",
            features: [
                                "Valid Till Exam",
                "2 QBank With (MDCAT + NUMS)",
                "Past Paper MCQs",
                "One Click Explanations",
                "Capy AI (New)",
                "Unlimited Mock Tests",
                "Syllabus tracker and schedule maker",
                "Performance analysis",
                "Mentorship & Guidance",
            ],
        },
    ]


    // Fetch course data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
                const res = await fetch(`${baseUrl}/api/v1/course/all`)
                if (!res.ok) throw new Error("Failed to fetch courses")
                const data: CourseItem[] = await res.json()

                const mapped: CourseData = {
                    mdcat: { description: "", price: 0, discount: 0 },
                    nums: { description: "", price: 0, discount: 0 },
                    "mdcat+nums": { description: "", price: 0, discount: 0 },
                }

                data.forEach((course) => {
                    if (course.cname === "mdcat" || course.cname === "nums" || course.cname === "mdcat+nums") {
                        mapped[course.cname] = {
                            description: course.cdesc,
                            price: course.cprice,
                            discount: course.cdiscount ?? 0,
                        }
                    }
                })

                setCourseData(mapped)
            } catch (error) {
                console.error("Error fetching course data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <section className="py-10 bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-8 py-4 mb-8">
                        <span className="text-2xl">🎓</span>
                        <span className="text-blue-800 font-semibold text-lg">Premium Course Collection</span>
                    </div>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Transform your entrance exam preparation with our expertly crafted courses
                    </p>
                </motion.div>

                {/* Simple Cards Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {courses.map((course, index) => {
                        const data = courseData[course.id as keyof CourseData]

                        return (
                            <motion.div
                                key={course.id}
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Link href={course.link}>
                                    <div className="group cursor-pointer h-full">
                                        <div
                                            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${course.bgGradient} shadow-xl ${course.shadowColor} group-hover:shadow-2xl transition-all duration-500 border border-white/50 h-full`}
                                        >
                                            {/* Badge */}
                                            {/* <div className="absolute top-2 right-2 z-20">
                                                <div
                                                    className={`${course.badgeColor} text-white px-2 py-1.5 rounded-full text-xs font-bold shadow-lg`}
                                                >
                                                    {course.badge}
                                                </div>
                                            </div> */}

                                            {/* Course Image Section */}
                                            <div className="relative  overflow-hidden">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient} opacity-10`} />

                                                {/* Decorative Elements */}
                                                <div className="absolute inset-0">
                                                    <div className="absolute top-8 left-8 w-20 h-20 bg-white/20 rounded-full blur-xl" />
                                                    <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                                    <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/15 rounded-full blur-lg" />
                                                </div>

                                                {/* Main Course Image */}
                                                <div className="relative z-10 bg-red h-max flex items-center justify-center p-0">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl blur-xl" />
                                                    <Image
                                                        src={course.image}
                                                        alt={course.title}
                                                        width={440}
                                                        height={440}
                                                        className="relative z-10 w-full h-full  object-contain drop-shadow-2xl"
                                                        priority={index < 3}
                                                    />
                                                </div>
                                            </div>

                                            {/* Course Content */}
                                            <div className="relative z-10 p-8 bg-white/80 backdrop-blur-sm">
                                                {/* Price Section */}
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <motion.div
                                                            className={`bg-gradient-to-r ${course.gradient} text-white px-6 py-3 rounded-2xl font-black  shadow-lg`}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            {loading ? (
                                                                <div className="w-20 h-8 bg-white/30 rounded animate-pulse" />
                                                            ) : (
                                                                `PKR ${data.discount > 0
                                                                    ? Math.round(data.price - (data.price * data.discount) / 100).toLocaleString()
                                                                    : data.price.toLocaleString()
                                                                }`
                                                            )}
                                                        </motion.div>
                                                        {!loading && data.discount > 0 && (
                                                            <span className="text-gray-400 line-through font-semibold text-base">
                                                                PKR {data.price.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!loading && data.discount > 0 && (
                                                        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm">
                                                            Save {data.discount}%
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Course Title */}
                                                <div className="mb-6">
                                                    <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                                        {course.title}
                                                    </h3>
                                                </div>
                                                {/* Features List */}
                                                <div className="space-y-3 mb-8">
                                                    {course.features.map((feature, featureIndex) => (
                                                        <motion.div
                                                            key={featureIndex}
                                                            className="flex items-center gap-3 group/feature"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: featureIndex * 0.1 }}
                                                        >
                                                            <div
                                                                className={`flex-shrink-0 w-6 h-6 bg-gradient-to-r ${course.gradient} rounded-full flex items-center justify-center shadow-lg group-hover/feature:scale-110 transition-transform duration-300`}
                                                            >
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <span className="text-gray-800 font-semibold group-hover/feature:text-gray-900 transition-colors duration-300">
                                                                {feature}
                                                            </span>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                                {/* CTA Button */}
                                                <motion.div className="relative" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                    <div
                                                        className={`absolute inset-0 bg-gradient-to-r ${course.gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`}
                                                    />
                                                    <div
                                                        className={`relative w-full bg-gradient-to-r ${course.gradient} text-white py-4 px-6 rounded-2xl font-bold text-lg text-center shadow-2xl group-hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3`}
                                                    >
                                                        <span>Enroll Now</span>
                                                        <motion.svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            animate={{ x: [0, 4, 0] }}
                                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                            />
                                                        </motion.svg>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Hover Shine Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </motion.div>


            </div>
        </section>
    )
}

export default Pricing
