"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Progress,
  Chip,
  Tooltip,
  Divider,
  Accordion,
  AccordionItem,
  Spacer,
  useDisclosure,
  ScrollShadow,
} from "@heroui/react"
import { ArrowLeft, X, ChevronLeft, ChevronRight, Cloud, MessageCircle } from "lucide-react"
import {
  Question,
  BookmarkSimple,
  FlagBanner,
  FloppyDisk,
  CaretLeft,
  CaretRight,
  Eye as PhosphorEye,
  ArrowsClockwise,
  CheckCircle as PhosphorCheckCircle,
  XCircle as PhosphorXCircle,
  Info as PhosphorInfo,
  List,
  Timer as PhosphorTimer,
} from "@phosphor-icons/react"
import FsLightbox from "fslightbox-react"
import { MathJax, MathJaxContext } from "better-react-mathjax"
import Timer from "./Timer"
import AIChatPopup from "./AIChatPopup"
import Axios from "@/lib/Axios"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

const Mcqs = ({ subject, chapter, topic, isSeries, mcqData }) => {
  console.log(mcqData)
  const router = useRouter()
  const [correctMcq, setCorrectMcq] = useState([])
  const [wrongMcq, setWrongMcq] = useState([])
  const [attempted, setAttempted] = useState([])
  const [showMockModel, setShowMockModel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [generatedExplanations, setGeneratedExplanations] = useState(new Map());
  const [isChatOpen, setIsChatOpen] = useState(false);


  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  // Auto-save related state
  const [lastSavedCorrect, setLastSavedCorrect] = useState([])
  const [lastSavedWrong, setLastSavedWrong] = useState([])
  const autoSaveIntervalRef = useRef(null)
  const testStartAt = new Date()

  const [lightboxController, setLightboxController] = useState({
    toggler: false,
    sourceIndex: 0,
  })

  const toggleLightbox = (imageUrl, sourceIndex = 0) => {
    setLightboxController({
      toggler: !lightboxController.toggler,
      sourceIndex: sourceIndex,
    })
  }

  const [data, setData] = useState(isSeries ? mcqData.questions : mcqData || [])
  const [mcqs, setMcqs] = useState([])
  const [sideBarOpen, setSidebarOpen] = useState(false)
  const [bioCorrectCout, setBioCorrectCount] = useState(0)
  const [chemCorrectCout, setChemCorrectCount] = useState(0)
  const [phyCorrectCount, setPhyCorrectCount] = useState(0)
  const [engCorrectCount, setEngCorrectCount] = useState(0)
  const [logicCorrectCount, setLogicCorrectCount] = useState(0)
  const [mockPercentageCount, setMockPercentageCout] = useState(0)
  const [showResultModel, setShowResultModel] = useState(false)

  // Modal controls
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure()
  const { isOpen: isTestStartOpen, onOpen: onTestStartOpen, onClose: onTestStartClose } = useDisclosure()
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure()
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure()
  const { isOpen: isSidebarOpen, onOpen: onSidebarOpen, onClose: onSidebarClose } = useDisclosure()

  const [testStart, setTestStart] = useState(true)
  const [reportData, setReportData] = useState({ msg: "" })

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe && index < mcqs.length - 1) {
      nextOption()
    }
    if (isRightSwipe && index > 0) {
      prevOption()
    }
  }

  const showNotification = (message, type = "default") => {
    if (type === "success") {
      toast.success(message)
    } else if (type === "error") {
      toast.error(message)
    } else if (type === "warning") {
      toast(message, { icon: "⚠️" })
    } else {
      toast(message)
    }
  }

  // Auto-save function
  const autoSaveProgress = async () => {
    if (isSeries) return
    const hasNewCorrect =
      correctMcq.length !== lastSavedCorrect.length || !correctMcq.every((id) => lastSavedCorrect.includes(id))
    const hasNewWrong =
      wrongMcq.length !== lastSavedWrong.length || !wrongMcq.every((id) => lastSavedWrong.includes(id))
    if ((hasNewCorrect || hasNewWrong) && (correctMcq.length > 0 || wrongMcq.length > 0)) {
      try {
        if (subject === "mock") {
          return
        }
        setIsSaving(true)
        const response = await Axios.put("/api/v1/progress/save", {
          correctMcq,
          wrongMcq,
          autoSave: true,
        })
        setIsSaving(false)
        if (response.data.acknowledged) {
          setLastSavedCorrect([...correctMcq])
          setLastSavedWrong([...wrongMcq])
          toast.success("Progress auto-saved", { duration: 1500 })
        }
      } catch (error) {
        setIsSaving(false)
        console.error("Auto-save failed:", error)
      }
    }
  }

  // Set up auto-save interval
  useEffect(() => {
    if (!testStart && subject !== "mock" && !isSeries) {
      autoSaveIntervalRef.current = setInterval(() => {
        autoSaveProgress()
      }, 60000)
    }
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [testStart, correctMcq, wrongMcq, subject])

  useEffect(() => {
    setLoading(false)
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setMcqs(data?.map((mcq) => ({ ...mcq, selected: null, lock: false })))
  }, [data])

  useEffect(() => {
    if (testStart) {
      onTestStartOpen()
    }
  }, [testStart, onTestStartOpen])

  const saveMcqData = async () => {
    if (isSeries) {
      const testSubmit = new Date()
      const diffMs = testSubmit - testStartAt
      const durationMin = Math.floor(diffMs / 1000 / 60)

      try {
        const res = await Axios.post(`/api/v1/test/student/${mcqData?._id}/submit`, {
          answers: mcqs,
          duration: durationMin,
        });
        // console.log(res)
        if (res.data) {
          // console.log("response", res)
          showNotification("Check Stats In Dashboard", "success")
        }
      } catch (error) {
        console.log(error);
        return;
      }
      return
    }
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }
    if (correctMcq.length > 0 || wrongMcq.length > 0) {
      try {


        if (subject === "mock") {
          return router.back()
        }
        const response = await Axios.put("/api/v1/progress/save", {
          correctMcq,
          wrongMcq,
          finalSave: true,
        })
        if (response.data.acknowledged) {
          showNotification("Check Stats In Dashboard", "success")
        }
      } catch (error) { }
    } else {
      showNotification("Solved MCQ's Saved")
    }
  }

  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set())

  const handleBookmarked = async () => {
    const mcqId = mcqs[index]._id
    const isCurrentlyBookmarked = bookmarkedSet.has(mcqId)
    const endpoint = isCurrentlyBookmarked ? "/api/v1/mcq/unbookmark" : "/api/v1/mcq/bookmark"
    try {
      const res = await Axios.put(endpoint, { mcqId })
      if (res.status === 200) {
        setBookmarkedSet((prev) => {
          const next = new Set(prev)
          if (isCurrentlyBookmarked) {
            next.delete(mcqId)
          } else {
            next.add(mcqId)
          }
          return next
        })
        toast.success(isCurrentlyBookmarked ? "Bookmark Removed" : "MCQ Bookmarked", { duration: 1500 })
      } else {
        toast.error("Something Went Wrong", { duration: 1500 })
      }
    } catch (error) {
      toast.error("Something Went Wrong", { duration: 1500 })
    }
  }

  const [index, setIndex] = useState(0)
  const alphabets = ["A", "B", "C", "D"]
  const [isFlip, setIsFlip] = useState(false)

  const handleReportChange = (e) => {
    const { name, value } = e.target
    setReportData({ ...reportData, [name]: value, question: mcqs[index]?.question })
  }

  const handleReport = async () => {
    if (reportData.msg === "") {
      showNotification("Reason is required field", "warning")
      return
    }
    try {
      const response = await Axios.post("/api/v1/report", reportData)
      if (response.status === 201) {
        onReportClose()
        setReportData({ msg: "" })
        showNotification("We will review it shortly", "success")
        toast.success("Report submitted successfully", { duration: 1500 })
      } else {
        showNotification("Something Went Wrong", "error")
        toast.error("Failed to submit report", { duration: 1500 })
      }
    } catch (error) {
      showNotification("Something Went Wrong", "error")
      toast.error("Failed to submit report", { duration: 1500 })
    }
  }

  const ref1 = useRef()
  const ref2 = useRef()
  const ref3 = useRef()
  const ref4 = useRef()
  const refArray = [ref1, ref2, ref3, ref4]

  // Removed problematic useEffect
  useCallback(() => {
    if (mcqs[index]?.selected != null) {
      if (mcqs[index].correctOption === mcqs[index].selected) {
        refArray[mcqs[index].selected - 1].current.classList.add("correct")
      } else {
        refArray[mcqs[index].selected - 1].current.classList.add("wrong")
      }
    }
  }, [mcqs, index])

  const checkAns = (e, ans) => {
    if (mcqs[index].lock === false) {
      setMcqs((prevMcqs) => {
        const updatedMcqs = [...prevMcqs]
        updatedMcqs[index] = {
          ...updatedMcqs[index],
          lock: true,
          selected: ans,
        }
        return updatedMcqs
      })

      if (mcqs[index].correctOption === ans) {
        setCorrectMcq((prevMcq) => [...prevMcq, mcqs[index]._id])
        setAttempted((prev) => [...prev, index])
        if (subject === "mock") {
          if (index < 62) {
            setBioCorrectCount((prev) => prev + 1)
          } else if (index < 110) {
            setChemCorrectCount((prev) => prev + 1)
          } else if (index < 158) {
            setPhyCorrectCount((prev) => prev + 1)
          } else if (index < 174) {
            setEngCorrectCount((prev) => prev + 1)
          } else if (index < 180) {
            setLogicCorrectCount((prev) => prev + 1)
          }
        }
      } else {
        setWrongMcq((prevMcq) => [...prevMcq, mcqs[index]._id])
      }
    }
  }

  const nextOption = () => {
    setIsFlip(false)
    if (index < mcqs?.length - 1) {
      setIndex(index + 1)
    } else {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
      if (subject === "mock") {
        setMockPercentageCout(bioCorrectCout + phyCorrectCount + chemCorrectCout + engCorrectCount + logicCorrectCount)
        return showMockResult()
      }
      showMockResult()
      saveMcqData()
    }
  }

  const showMockResult = () => {
    setSidebarOpen(false)
    onSidebarClose()
    setShowMockModel(true)
    onResultOpen()
  }

  const prevOption = () => {
    setIsFlip(false)
    if (index > 0) {
      setIndex(index - 1)
    } else {
      setIndex(0)
    }
  }

  const handleSetIndex = (i) => {
    setIsFlip(false)
    setIndex(i)
    onSidebarClose()
  }

  const handleSaveAndExit = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }
    if (subject === "mock") {
      return router.back()
    }
    saveMcqData()
    return router.back()
  }

  const handleFlip = () => {
    const da = mcqs[index]
    if (da.lock) {
      setIsFlip(!isFlip)
      // Check if we need to generate explanation
      if (!isFlip && shouldGenerateExplanation(da)) {
        generateExplanation(da._id)
      }
    } else {
      showNotification("Attempt MCQ To See Explanation")
    }
  }

  const shouldGenerateExplanation = (mcq) => {
    return !mcq.explain || mcq.explain.trim() === '' || mcq.explain === 'Explanation Not provided'
  }

  const generateExplanation = async (mcqId) => {
    // Check if already generated in this session
    if (generatedExplanations.has(mcqId)) {
      return
    }

    try {
      setIsGeneratingExplanation(true)
      const mcqType = isSeries ? 'SeriesMCQ' : 'MCQ'
      
      const response = await Axios.post('/api/v1/explanation/generate', {
        mcqId,
        mcqType
      })

      if (response.data.explanation) {
        // Update the explanation in the current MCQ list
        setMcqs(prevMcqs => {
          const updated = [...prevMcqs]
          const currentIndex = updated.findIndex(m => m._id === mcqId)
          if (currentIndex !== -1) {
            updated[currentIndex] = {
              ...updated[currentIndex],
              explain: response.data.explanation,
              aiGenerated: true
            }
          }
          return updated
        })

        // Store in generated cache
        setGeneratedExplanations(prev => new Map(prev.set(mcqId, response.data.explanation)))

        if (response.data.source === 'ai_generated') {
          toast.success('Explanation generated!', { duration: 2000 })
        }
      }
    } catch (error) {
      console.error('Failed to generate explanation:', error)
      
      const errorData = error.response?.data
      
      if (errorData?.action === 'api_key_required') {
        toast.error('Please configure your AI API key in settings', { duration: 4000 })
      } else if (errorData?.error === 'Quota exceeded') {
        toast.error('Monthly quota exceeded. Resets next month.', { duration: 4000 })
      } else {
        toast.error('Failed to generate explanation', { duration: 3000 })
      }
    } finally {
      setIsGeneratingExplanation(false)
    }
  }

  const config = {
    loader: { load: ["input/tex", "output/chtml", "[tex]/ams"] },
    tex: {
      packages: { "[+]": ["ams"] },
      inlineMath: [
        ["$", "$"],
        ["\\(", "\\)"],
      ],
      displayMath: [
        ["$$", "$$"],
        ["\\[", "\\]"],
      ],
    },
  }

  const getQuestionStatusColor = (mcqId, currentIndex) => {
    if (correctMcq.includes(mcqId)) return "success"
    if (wrongMcq.includes(mcqId)) return "danger"
    if (currentIndex === index) return "primary"
    return "default"
  }

  const getQuestionStatusVariant = (mcqId, currentIndex) => {
    if (correctMcq.includes(mcqId) || wrongMcq.includes(mcqId) || currentIndex === index) return "solid"
    return "bordered"
  }

  if (mcqData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No MCQs Found</h2>
          <p className="text-gray-500">Try changing your filters or check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <MathJaxContext version={3} config={config}>
      <div className="h-screen  overscroll-auto flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button isIconOnly variant="light" onPress={() => router.back()} className="text-blue-600" size="sm">
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {index + 1}/{mcqs?.length}
              </span>
              {subject !== "mock" && (
                <Chip size="sm" color="success" variant="flat" className="text-xs">
                  {isSaving ? "Saving..." : "Standby"}
                </Chip>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button isIconOnly variant="light" onPress={onSidebarOpen} className="text-blue-600" size="sm">
                <List size={20} />
              </Button>
              <Button isIconOnly variant="light" onPress={handleSaveAndExit} className="text-blue-600" size="sm">
                <FloppyDisk size={20} />
              </Button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <Progress
              value={((index + 1) / mcqs.length) * 100}
              color="primary"
              size="sm"
              classNames={{
                track: "drop-shadow-sm border border-default-200",
                indicator: "bg-gradient-to-r from-blue-500 to-purple-500",
              }}
            />
          </div>
        </div>

        {/* Desktop Header - Fixed */}
        <div className="hidden lg:block flex-shrink-0 p-3">
          <Card className={`shadow-lg bg-gradient-to-r ${subject === "mock" && "from-purple to-pink/80"} `}>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant={subject === "mock" ? "flat" : "light"}
                  startContent={<ArrowLeft size={18} />}
                  onClick={() => router.back()}
                  className="text-blue-600 font-medium"
                >
                  Back
                </Button>
                {(subject === "mock" || isSeries) && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <PhosphorTimer size={28} className="text-white" />
                      <h2 className="text-xl font-bold text-primary">Time Remaining</h2>
                    </div>
                    <div className="text-xl font-extrabold text-gray-200 tracking-wide">
                      {loading ? (
                        <span className="text-base font-medium text-gray-500">Calculating time...</span>
                      ) : (
                        <Timer initialTimeInMinutes={mcqData?.durationMin || 150} handleSaveAndExit={handleSaveAndExit} />
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {(subject !== "mock" && !isSeries) && (
                    <Chip size="sm" color="success" variant="flat" className="text-xs">
                      {isSaving ? (
                        <div className="flex items-center gap-1">
                          <Cloud size={18} /> Saving
                        </div>
                      ) : (
                        "Auto-saving every minute"
                      )}
                    </Chip>
                  )}
                  <Button
                    color="primary"
                    startContent={<FloppyDisk size={18} />}
                    onClick={handleSaveAndExit}
                    className="font-medium"
                  >
                    Save & Exit
                  </Button>
                </div>
              </div>
              <Progress
                value={((index + 1) / mcqs.length) * 100}
                color="primary"
                className="mb-2"
                classNames={{
                  track: "drop-shadow-md border border-default",
                  indicator: "bg-gradient-to-r from-blue-500 to-purple-500",
                  label: "tracking-wider font-medium text-default-600",
                  value: "text-foreground/60",
                }}
              />
            </CardBody>
          </Card>
        </div>

        {/* Main Content Area - Flexible */}
        <div className="flex-1 max-h- h-full  overflow-auto flex flex-col px-0 md:px-4 lg:px-6 mt-3 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Desktop Sidebar - Fixed Height */}
            <div className="hidden lg:block lg:col-span-1 h-full">
              <Card className="shadow-lg flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
                  <h4 className="text-lg font-semibold">Questions Overview</h4>
                </CardHeader>
                <CardBody className="flex-1 overflow-y-auto ps-1">
                  <ScrollShadow className="h-full">
                    <div className="flex flex-wrap gap-2 pb-4">
                      {mcqs.map((mcq, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={getQuestionStatusVariant(mcq._id, i)}
                          color={getQuestionStatusColor(mcq._id, i)}
                          onPress={() => handleSetIndex(i)}
                          className="aspect-square min-w-0 text-xs font-medium"
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                  </ScrollShadow>
                </CardBody>
              </Card>
            </div>

            {/* Main Question Area - Full Height */}
            <div className="lg:col-span-3 h-full py-3  flex flex-col flex-shrink flex-grow flex-1 justify-between">
              <Card
                className="shadow-xl flex flex-col h-full overflow-auto"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Desktop Question Header - Fixed */}
                <CardHeader className="hidden  lg:flex flex-shrink-0">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">
                        Question {index + 1}/{mcqs?.length}
                      </h3>
                      {(subject || chapter || topic) && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <span className="text-gray-300 ">|</span>
                          {subject && <span className="capitalize font-medium text-blue-600 bg-gray-200 px-1 rounded">{decodeURIComponent(subject)}</span>}
                          {subject && (chapter || topic) && <span className="text-gray-300">/</span>}
                          {chapter && <span className="capitalize text-gray-600">{decodeURIComponent(chapter)}</span>}
                          {chapter && topic && <span className="text-gray-300">/</span>}
                          {topic && <span className="capitalize text-purple-600 font-medium">{decodeURIComponent(topic)}</span>}
                        </div>
                      )}
                      {mcqs[index]?.info && (
                        <Chip color="secondary" variant="flat" className="capitalize">
                          {mcqs[index]?.info}
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip content={bookmarkedSet.has(mcqs[index]?._id) ? "Remove bookmark" : "Bookmark this question"}>
                        <Button isIconOnly variant="light" onClick={handleBookmarked} className="text-blue-600">
                          <BookmarkSimple size={20} weight={bookmarkedSet.has(mcqs[index]?._id) ? "fill" : "regular"} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>

                {/* Mobile Question Header - Fixed */}
                <CardHeader className="lg:hidden  flex-shrink-0">
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(subject || chapter || topic) && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {subject && <span className="capitalize font-medium text-blue-600">{decodeURIComponent(subject)}</span>}
                            {subject && (chapter || topic) && <span className="text-gray-300">/</span>}
                            {chapter && <span className="capitalize text-gray-600 truncate max-w-[120px]">{decodeURIComponent(chapter)}</span>}
                            {chapter && topic && <span className="text-gray-300">/</span>}
                            {topic && <span className="capitalize text-purple-600 font-medium truncate max-w-[100px]">{decodeURIComponent(topic)}</span>}
                          </div>
                        )}
                        {mcqs[index]?.info && (
                          <Chip color="secondary" variant="flat" size="sm" className="capitalize">
                            {mcqs[index]?.info}
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          variant="light"
                          onClick={handleBookmarked}
                          className="text-blue-600"
                          size="sm"
                        >
                          <BookmarkSimple size={18} weight={bookmarkedSet.has(mcqs[index]?._id) ? "fill" : "regular"} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Scrollable Content Area */}
                <CardBody className="flex-1 h-[100%]  overflow-y-auto ">
                  <ScrollShadow className="h-full">
                    <div className="space-y-4 lg:space-y-6 pb-4">
                      {/* Question - Fixed */}
                      <div className="flex-shrink-0">
                        {/* <div className="flex items-center gap-2 mb-3">
                          <Question size={20} className="text-blue-600" />
                          <h4 className="text-base lg:text-lg font-semibold text-blue-600">Question:</h4>
                        </div> */}
                        <Card className="bg-slate-50 border-l-4 border-l-blue-500">
                          <CardBody className="py-3 lg:py-4">
                            <MathJax dynamic inline className="text-sm lg:text-lg">
                              {mcqs[index]?.question}
                            </MathJax>
                          </CardBody>
                        </Card>
                        {/* Question Image */}
                        {mcqs[index]?.questionImg && (
                          <div className="mt-4">
                            <div className="relative">
                              <img
                                src={mcqs[index]?.questionImg}
                                alt="Question"
                                className="max-h-20  object-contain cursor-pointer rounded-lg"
                                onClick={() => toggleLightbox(mcqs[index]?.questionImg, 0)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center h-48 lg:h-64 text-gray-500">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-sm lg:text-base">Please wait a moment...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          {!isFlip ? (
                            // Options - Scrollable
                            <div>
                              <h5 className="text-sm lg:text-md font-medium text-gray-600 mb-4">
                                Choose the correct answer:
                              </h5>
                              <div className="space-y-3 max-h-[60%] overflow-y-auto">
                                {mcqs[index]?.options.map((option, optionIndex) => {
                                  const isSelected = mcqs[index].lock && mcqs[index].selected === optionIndex + 1
                                  const isCorrectOption = optionIndex + 1 === mcqs[index].correctOption
                                  const isCorrect = isSelected && mcqs[index].selected === mcqs[index].correctOption
                                  return (
                                    <div
                                      key={optionIndex}
                                      ref={refArray[optionIndex]}
                                      onClick={(e) => checkAns(e, optionIndex + 1)}
                                      className={`mcq-option p-3 lg:p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-md active:scale-[0.98] ${mcqs[index].lock
                                        ? isSelected
                                          ? isCorrect
                                            ? "correct"
                                            : "wrong"
                                          : isCorrectOption
                                            ? "correct"
                                            : "border-gray-200"
                                        : "border-gray-200"
                                        }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Chip
                                          variant="flat"
                                          size="sm"
                                          className="min-w-8 h-8 flex items-center justify-center pointer-events-none select-none"
                                        >
                                          {alphabets[optionIndex]}
                                        </Chip>
                                        <MathJax dynamic
                                          className="pointer-events-none select-none text-sm lg:text-base flex-1"
                                        >
                                          {option}
                                        </MathJax>
                                        {isSelected && (
                                          <span className="ml-2">
                                            {isCorrect ? (
                                              <PhosphorCheckCircle size={20} className="text-green-600" />
                                            ) : (
                                              <PhosphorXCircle size={20} className="text-red-600" />
                                            )}
                                          </span>
                                        )}
                                        {mcqs[index].lock && !isSelected && isCorrectOption && (
                                          <span className="ml-2">
                                            <PhosphorCheckCircle size={20} className="text-green-600" />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            // Explanation - Scrollable
                            <div className="grid max-h-[40vh] gap-4 lg:gap-6">
                              {mcqs[index]?.imageUrl &&
                                <div>
                                  <h5 className="text-base lg:text-lg font-semibold text-blue-600 mb-4">
                                    Reference Image
                                  </h5>
                                  {mcqs[index]?.imageUrl && (
                                    <div className="relative">
                                      <img
                                        src={mcqs[index]?.imageUrl || "/placeholder.svg"}
                                        alt="Reference"
                                        className=" max-h-20 lg:max-h-20 object-contain cursor-pointer rounded-lg"
                                        onClick={() => toggleLightbox(mcqs[index]?.imageUrl, mcqs[index]?.questionImg ? 1 : 0)}
                                      />
                                    </div>
                                  )}
                                </div>
                              }
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-base lg:text-lg font-semibold text-blue-600">Explanation</h5>
                                  {mcqs[index]?.aiGenerated && (
                                    <Chip size="sm" color="secondary" variant="flat" className="text-xs">
                                      AI Generated
                                    </Chip>
                                  )}
                                </div>
                                {isGeneratingExplanation ? (
                                  <Card className="bg-blue-50 border-l-4 border-l-blue-500">
                                    <CardBody className="py-3 lg:py-4">
                                      <div className="flex flex-col items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                        <p className="text-sm text-gray-600">Generating explanation with AI...</p>
                                        <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ) : (
                                  <Card className="bg-green-50 border-l-4 border-l-green-500">
                                    <CardBody className="py-3 lg:py-4">
                                      <MathJax dynamic
                                        inline
                                        className="text-sm lg:text-base leading-relaxed whitespace-pre-line"
                                      >
                                        {mcqs[index]?.explain || "Explanation not available yet"}
                                      </MathJax>
                                      {mcqs[index]?.explain && mcqs[index]?.explain !== "Explanation not available yet" && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                          <Button
                                            color="primary"
                                            variant="flat"
                                            size="sm"
                                            onClick={() => setIsChatOpen(true)}
                                            startContent={<MessageCircle size={16} />}
                                          >
                                            Chat More About This
                                          </Button>
                                        </div>
                                      )}
                                    </CardBody>
                                  </Card>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollShadow>
                </CardBody>
              </Card>

              {/* Mobile Action Buttons - Fixed */}
              <div className="lg:hidden  mt-4 px-2 flex-shrink-0">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    variant="bordered"
                    startContent={<CaretLeft size={18} />}
                    onPress={prevOption}
                    isDisabled={index === 0}
                    className="h-12"
                  >
                    Previous
                  </Button>
                  <Button color="primary" endContent={<CaretRight size={18} />} onClick={nextOption} className="h-12">
                    {index === mcqs?.length - 1 ? (subject === "mock" ? "Result" : "Submit") : "Next"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={isReportOpen ? "solid" : "bordered"}
                    color={isReportOpen ? "danger" : "default"}
                    onClick={onReportOpen}
                    startContent={<FlagBanner size={16} />}
                    size="sm"
                  >
                    Report
                  </Button>
                  {chapter !== "test" && (
                    <Button
                      variant="bordered"
                      startContent={<ArrowsClockwise size={16} />}
                      onPress={handleFlip}
                      size="sm"
                    >
                      {isFlip ? "Question" : "Explain"}
                    </Button>
                  )}
                  <Button variant="bordered" startContent={<PhosphorEye size={16} />} onClick={onSidebarOpen} size="sm">
                    Overview
                  </Button>
                </div>
              </div>

              {/* Desktop Action Buttons - Fixed */}
              <div className="hidden  lg:block mt-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <Button
                    variant="bordered"
                    startContent={<ChevronLeft size={18} />}
                    onClick={prevOption}
                    isDisabled={index === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    <Tooltip content="Report this question">
                      <Button
                        isIconOnly
                        variant={isReportOpen ? "solid" : "bordered"}
                        color={isReportOpen ? "danger" : "default"}
                        onClick={onReportOpen}
                      >
                        <FlagBanner size={18} />
                      </Button>
                    </Tooltip>
                    {chapter !== "test" && (
                      <Button variant="bordered" startContent={<ArrowsClockwise size={18} />} onClick={handleFlip}>
                        {isFlip ? "Question" : "Explanation"}
                      </Button>
                    )}
                  </div>
                  <Button color="primary" endContent={<ChevronRight size={18} />} onClick={nextOption}>
                    {index === mcqs?.length - 1 ? (subject === "mock" ? "View Result" : "Submit") : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Drawer */}
        <Modal
          isOpen={isSidebarOpen}
          hideCloseButton
          onClose={onSidebarClose}
          placement="bottom"
          className="lg:hidden"
          size="full"
        >
          <ModalContent>
            <ModalHeader className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">Questions Overview</h4>
              <Button isIconOnly variant="light" onPress={onSidebarClose} size="sm">
                <X size={20} />
              </Button>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="flex flex-wrap justify-center gap-2 overflow-y-auto max-h-[90vh]">
                {mcqs.map((mcq, i) => (
                  <Button
                    key={i}
                    size="md"
                    variant={getQuestionStatusVariant(mcq._id, i)}
                    color={getQuestionStatusColor(mcq._id, i)}
                    onPress={() => handleSetIndex(i)}
                    className="aspect-square min-w-0 text-sm font-medium h-12"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Lightbox */}
        <FsLightbox
          toggler={lightboxController.toggler}
          sources={[
            mcqs[index]?.questionImg,
            mcqs[index]?.imageUrl
          ].filter(Boolean)}
          sourceIndex={lightboxController.sourceIndex}
          zoomIncrement={0.1}
        />

        {/* Report Modal */}
        <Modal isOpen={isReportOpen} onClose={onReportClose} size="2xl">
          <ModalContent>
            <ModalHeader className="text-red-600 flex items-center gap-2">
              <FlagBanner size={20} />
              Report MCQ
            </ModalHeader>
            <ModalBody>
              <Textarea
                label="Reason (required)"
                placeholder="Please describe the issue with this question..."
                name="msg"
                onChange={handleReportChange}
                minRows={4}
                isRequired
                classNames={{
                  input: "text-base",
                  inputWrapper: "min-h-[120px]",
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onReportClose}>
                Cancel
              </Button>
              <Button color="danger" onPress={handleReport} startContent={<FlagBanner size={16} />}>
                Report
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Test Start Modal */}
        <Modal isOpen={isTestStartOpen} isDismissable={false} hideCloseButton size="3xl">
          <ModalContent>
            <ModalHeader className="text-center">
              <h2 className="text-xl lg:text-2xl font-bold text-blue-600">Test Instructions</h2>
            </ModalHeader>
            <ModalBody>
              <Card shadow="none">
                <CardBody>
                  <ul className="space-y-3 text-sm lg:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✅</span>
                      You can select only one option per question
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">⚠️</span>
                      Once an option is selected, it cannot be changed later
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">📝</span>
                      You can solve only {subject === "mock" ? "180" : "100"} MCQs in one go
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">💾</span>
                      {subject === "mock"
                        ? "Mock test results are shown immediately after completion"
                        : "Your progress is automatically saved every minute"}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">📊</span>
                      {subject === "mock"
                        ? "Check Mock-test result after completion"
                        : "Your data will enter the stats only if you submit or save the test"}
                    </li>
                    <li className="flex items-start gap-2 lg:hidden">
                      <span className="text-blue-600 font-bold">👈👉</span>
                      Swipe left/right to navigate between questions
                    </li>
                  </ul>
                </CardBody>
              </Card>
            </ModalBody>
            <ModalFooter className="justify-center">
              <Button variant="bordered" size="lg" onClick={() => router.back()}>
                Quit
              </Button>
              <Button
                color="primary"
                size="lg"
                onClick={() => {
                  setTestStart(false)
                  onTestStartClose()
                }}
              >
                Start Test
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Result Modal */}
        <Modal isOpen={isResultOpen} isDismissable={false} hideCloseButton size="5xl" scrollBehavior="inside">
          <ModalContent>
            <ModalBody className="p-4 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <Card className="bg-blue-600 text-white">
                  <CardBody className="text-center space-y-4 lg:space-y-6">
                    <h3 className="text-xl lg:text-2xl font-bold">Your Result</h3>
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-white/20 flex flex-col items-center justify-center mx-auto">
                      <span className="text-2xl lg:text-3xl font-bold">
                        {subject === "mock" ? mockPercentageCount : correctMcq.length}
                      </span>
                      <span className="text-xs lg:text-sm opacity-90">of {mcqs?.length}</span>
                    </div>
                    <div>
                      <h4 className="text-lg lg:text-xl font-bold mb-2">
                        {subject === "mock"
                          ? mockPercentageCount < 100
                            ? "Needs Improvement"
                            : mockPercentageCount < 150
                              ? "Satisfactory"
                              : "Excellent"
                          : correctMcq.length < mcqs.length / 2
                            ? "Needs Improvement"
                            : correctMcq.length < mcqs.length / 1.33
                              ? "Satisfactory"
                              : "Excellent"}
                      </h4>
                      <p className="text-xs lg:text-sm opacity-90 leading-relaxed px-2">
                        {subject === "mock"
                          ? mockPercentageCount < 100
                            ? "Consider utilizing tutoring resources and dedicating more time to study and practice."
                            : mockPercentageCount < 150
                              ? "Your performance is satisfactory, but there is potential for improvement."
                              : "You have demonstrated an excellent understanding of the material."
                          : correctMcq.length < mcqs.length / 2
                            ? "Consider utilizing tutoring resources and dedicating more time to study and practice."
                            : correctMcq.length < mcqs.length / 1.33
                              ? "Your performance is satisfactory, but there is potential for improvement."
                              : "You have demonstrated an excellent understanding of the material."}
                      </p>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader>
                    <h4 className="text-lg lg:text-xl font-bold">Summary</h4>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <Card className="bg-green-50 border-l-4 border-l-green-500">
                        <CardBody className="text-center py-3">
                          <PhosphorCheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">{subject !== "mock" ? "Correct" : "Biology"}</p>
                          <p className="text-lg lg:text-xl font-bold text-green-600">
                            {subject === "mock" ? `${bioCorrectCout}/81` : correctMcq?.length}
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-orange-50 border-l-4 border-l-orange-500">
                        <CardBody className="text-center py-3">
                          <PhosphorInfo size={24} className="text-orange-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">{subject !== "mock" ? "Unattempted" : "Chemistry"}</p>
                          <p className="text-lg lg:text-xl font-bold text-orange-600">
                            {subject === "mock" ? `${chemCorrectCout}/45` : mcqs.length - (correctMcq?.length + wrongMcq?.length)}
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-red-50 border-l-4 border-l-red-500">
                        <CardBody className="text-center py-3">
                          <PhosphorXCircle size={24} className="text-red-600 mx-auto mb-2" />
                          <p className="font-semibold text-sm">{subject !== "mock" ? "Wrong" : "Physics"}</p>
                          <p className="text-lg lg:text-xl font-bold text-red-600">
                            {subject === "mock" ? `${phyCorrectCount}/36` : wrongMcq?.length}
                          </p>
                        </CardBody>
                      </Card>
                      <Card className="bg-blue-50 border-l-4 border-l-blue-500">
                        <CardBody className="text-center py-3">
                          <div className="text-xl lg:text-2xl text-blue-600 mx-auto mb-2">%</div>
                          <p className="font-semibold text-sm">{subject !== "mock" ? "Percentage" : "English"}</p>
                          <p className="text-lg lg:text-xl font-bold text-blue-600">
                            {subject === "mock"
                              ? `${engCorrectCount}/9`
                              : `${((correctMcq?.length / mcqs.length) * 100).toFixed(1)}%`}
                          </p>
                        </CardBody>
                      </Card>
                      {subject === "mock" && (
                        <Card className="bg-purple-50 border-l-4 border-l-purple-500 col-span-2">
                          <CardBody className="text-center py-3">
                            <p className="font-semibold text-sm">Logical Reasoning</p>
                            <p className="text-lg lg:text-xl font-bold text-purple-600">{logicCorrectCount}/9</p>
                          </CardBody>
                        </Card>
                      )}
                    </div>
                    <Spacer y={4} />
                    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-center">
                      {subject !== "mock" && (
                        <Button color="primary" onPress={onReviewOpen} className="w-full lg:w-auto">
                          Review Answers
                        </Button>
                      )}
                      <Button variant="bordered" onClick={() => router.back()} className="w-full lg:w-auto">
                        Continue
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Review Modal */}
        <Modal isOpen={isReviewOpen} onClose={onReviewClose} size="full" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>
              <h3 className="text-xl lg:text-2xl font-bold text-center w-full">Review Your Attempted MCQs</h3>
            </ModalHeader>
            <ModalBody className="px-2 lg:px-6">
              {subject !== "mock" ? (
                <Accordion variant="splitted">
                  {mcqs.map((ele, i) => (
                    <AccordionItem
                      key={ele._id || i}
                      title={
                        <div>
                          <span className="font-bold text-sm lg:text-base">Q:{i + 1}) </span>
                          <MathJax dynamic inline className="text-sm lg:text-base">
                            {ele.question}
                          </MathJax>
                        </div>
                      }
                      aria-label={`Question ${i + 1}`}
                      className="text-base lg:text-lg mcq-option"
                    >
                      <div className="space-y-3 lg:space-y-4">
                        <div className="space-y-2">
                          {ele.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-2 lg:p-3 rounded-lg border ${correctMcq.includes(ele._id) && optionIndex + 1 === ele.selected
                                ? "correct"
                                : wrongMcq.includes(ele._id) && optionIndex + 1 === ele.selected
                                  ? "wrong"
                                  : wrongMcq.includes(ele._id) && optionIndex + 1 === ele.correctOption
                                    ? "correct"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <Chip size="sm" variant="flat">
                                  {alphabets[optionIndex]}
                                </Chip>
                                <MathJax dynamic inline className="text-sm lg:text-base">
                                  {option}
                                </MathJax>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                          <div>
                            {correctMcq.includes(ele._id) && (
                              <Chip color="success" size="sm">
                                Attempt Correct
                              </Chip>
                            )}
                            {wrongMcq.includes(ele._id) && (
                              <Chip color="danger" size="sm">
                                Attempt Wrong
                              </Chip>
                            )}
                            {!correctMcq.includes(ele._id) && !wrongMcq.includes(ele._id) && (
                              <Chip color="default" size="sm">
                                Not Attempted
                              </Chip>
                            )}
                          </div>
                          <div>
                            {!correctMcq.includes(ele._id) && (
                              <span className="text-xs lg:text-sm text-gray-600">
                                <Chip color="success" className=" text-white">
                                  Correct option: {ele.correctOption}
                                </Chip>
                              </span>
                            )}
                          </div>
                        </div>
                        <Divider />
                        <div>
                          <p className="text-gray-600 mb-2 text-sm lg:text-base">Explanation:</p>
                          <MathJax dynamic className="whitespace-pre-line !text-sm lg:text-base" inline>
                            {ele.explain || "Not available"}
                          </MathJax>
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Accordion variant="splitted">
                  {["biology", "chemistry", "physics", "english", "logic"].map((subjectType) => {
                    const subjectMcqs = mcqs.filter((ele) => ele.subject === subjectType)
                    return (
                      <div key={subjectType} className="mb-6">
                        <h3 className="text-lg lg:text-xl font-semibold mb-3">
                          {subjectType.charAt(0).toUpperCase() + subjectType.slice(1)}
                        </h3>
                        <Accordion variant="splitted">
                          {subjectMcqs.map((ele, i) => (
                            <AccordionItem
                              key={ele._id || i}
                              title={
                                <div>
                                  <span className="font-bold text-sm lg:text-base">Q:{i + 1}) </span>
                                  <MathJax dynamic inline className="text-sm lg:text-base">
                                    {ele.question}
                                  </MathJax>
                                </div>
                              }
                              aria-label={`Question ${i + 1}`}
                              className="text-base lg:text-lg font-semibold"
                            >
                              <Card className="shadow-md">
                                <CardBody className="space-y-3 lg:space-y-4">
                                  <div>
                                    <span className="font-bold text-sm lg:text-base">Q:{i + 1}) </span>
                                    <MathJax dynamic inline className="text-sm lg:text-base">
                                      {ele.question}
                                    </MathJax>
                                  </div>
                                  <div className="space-y-2 mcq-option">
                                    {ele.options.map((option, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className={`p-2 lg:p-3 rounded-lg border ${correctMcq.includes(ele._id) && optionIndex + 1 === ele.selected
                                          ? "correct"
                                          : wrongMcq.includes(ele._id) && optionIndex + 1 === ele.selected
                                            ? "wrong"
                                            : wrongMcq.includes(ele._id) && optionIndex + 1 === ele.correctOption
                                              ? "correct"
                                              : "bg-gray-50 border-gray-200"
                                          }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Chip size="sm" variant="flat">
                                            {alphabets[optionIndex]}
                                          </Chip>
                                          <MathJax dynamic inline className="text-sm lg:text-base">
                                            {option}
                                          </MathJax>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                                    <div>
                                      {correctMcq.includes(ele._id) && (
                                        <Chip color="success" size="sm">
                                          Attempt right
                                        </Chip>
                                      )}
                                      {wrongMcq.includes(ele._id) && (
                                        <Chip color="danger" size="sm">
                                          Attempt Wrong
                                        </Chip>
                                      )}
                                      {!correctMcq.includes(ele._id) && !wrongMcq.includes(ele._id) && (
                                        <Chip color="default" size="sm">
                                          Not Attempted
                                        </Chip>
                                      )}
                                    </div>
                                    {/* <div>
                                      {!correctMcq.includes(ele._id) && (
                                        <span className="text-xs lg:text-sm text-gray-600">
                                          Correct option: {ele.correctOption}
                                        </span>
                                      )}
                                    </div> */}
                                  </div>
                                  <Divider />
                                  <div>
                                    <p className="text-gray-600 mb-2 text-sm lg:text-base"> Explanation:</p>
                                    <MathJax dynamic className="whitespace-pre-line !text-sm lg:text-base" inline>
                                      {ele.explain || "Not available"}
                                    </MathJax>
                                  </div>
                                </CardBody>
                              </Card>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )
                  })}
                </Accordion>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
      <style jsx>{`
        .mcq-option:hover {
          border-color: #3b82f6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-1px);
        }
        .mcq-option.correct {
          background: #f0fdf4 !important;
          border-color: #22c55e !important;
        }
        .mcq-option.wrong {
          background: #fef2f2 !important;
          border-color: #ef4444 !important;
        }
        @media (max-width: 1024px) {
          .mcq-option:active {
            transform: scale(0.98);
          }
        }
          .correct {
          background: #f0fdf4 !important;
          border-color: #22c55e !important;
        }
          .wrong {
          background: #fef2f2 !important;
          border-color: #ef4444 !important;
        }
      `}</style>

      {/* AI Chat Popup */}
      {mcqs[index] && (
        <AIChatPopup
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mcq={mcqs[index]}
          mcqType={isSeries ? "SeriesMCQ" : "MCQ"}
        />
      )}
    </MathJaxContext>
  )
}

export default Mcqs