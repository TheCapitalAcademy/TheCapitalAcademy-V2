"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { bioTopicsNamesNums, chemistryTopicsNamesNums, physicsTopicsNamesNums } from "@/data/CourseTopic/nums"
import { bioTopicsNamesMdcat, chemistryTopicsNamesMdcat, physicsTopicsNamesMdcat } from "@/data/CourseTopic/mdcat"
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react"
import {
  ArrowUDownLeft,
  Warning,
  Check,
  CheckCircle,
  X,
  ArrowClockwise,
  CheckFat
} from "@phosphor-icons/react"
import Axios from "@/lib/Axios"

interface PageProps {
  params: {
    course: string
    subject: string
    chapter: string
  }
}


const Page = ({ params }: PageProps) => {
  const { course, subject, chapter } = params
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [topics, setTopics] = useState<string[]>([])
  const [chapterName, setChapterName] = useState(decodeURIComponent(chapter))
  const [category, setCategory] = useState("unsolved")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [mcqCount, setMcqCount] = useState<any[]>([])
  const [isMcqAvailable, setIsMcqAvailable] = useState(false);

  useEffect(() => {
    const loadTopics = () => {
      if (course === "mdcat" || course == "trial") {
        if (subject === "biology") setTopics(bioTopicsNamesMdcat[chapterName] || [])
        else if (subject === "chemistry") setTopics(chemistryTopicsNamesMdcat[chapterName] || [])
        else if (subject === "physics") setTopics(physicsTopicsNamesMdcat[chapterName] || [])
        else if (["english", "logic"].includes(subject)) setTopics([chapterName])
        else if (subject === "mock") setTopics(["Mock Test"])
      } else if (course === "nums") {
        if (subject === "biology") setTopics(bioTopicsNamesNums[chapterName] || [])
        else if (subject === "chemistry") setTopics(chemistryTopicsNamesNums[chapterName] || [])
        else if (subject === "physics") setTopics(physicsTopicsNamesNums[chapterName] || [])
        else if (["english", "logic"].includes(subject)) setTopics([chapterName])
        else if (subject === "mock") setTopics(["Mock Test"])
      } else if (course === "mdcatNums") {
        // Combo: Bio, Chem, Physics, English from NUMS; Logic from MDCAT
        if (subject === "logic") {
          setTopics([chapterName])
        } else if (subject === "biology") setTopics(bioTopicsNamesNums[chapterName] || [])
        else if (subject === "chemistry") setTopics(chemistryTopicsNamesNums[chapterName] || [])
        else if (subject === "physics") setTopics(physicsTopicsNamesNums[chapterName] || [])
        else if (subject === "english") setTopics([chapterName])
        else if (subject === "mock") setTopics(["Mock Test"])
      }
    }

    loadTopics()
  }, [course, subject, chapterName])

  // Uncomment when ready to use
  useEffect(() => {
    const fetchData = async () => {
      const res = await Axios.post('/api/v1/mcq/count', {
        course: course === "trial" ? "mdcat" : course,
        subject,
        chapter: chapterName,
        topic: topics,
        category,
      });
      setMcqCount(res.data);
    };
    if (topics.length > 0) fetchData();
  }, [category, topics]);

  useEffect(() => {
    const topicData = mcqCount.find((e) => e.topic === selectedTopic || ["english", "logic"].includes(e.subject))
    setIsMcqAvailable(topicData?.count > 0)
  }, [selectedTopic, mcqCount])

  const handleNextClick = () => {
    if (isMcqAvailable || subject === "mock") {
      const encodedParams = `/solve-mcq?course=${encodeURIComponent(course)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapterName)}&topic=${encodeURIComponent(selectedTopic)}&category=${encodeURIComponent(category)}`
      router.push(encodedParams);
    } else {
      onOpen()
    }
  }

  const getIcon = (type: string) => {
    const iconProps = { size: 20, weight: "duotone" as const }
    switch (type) {
      case "unsolved":
        return <Warning {...iconProps} className="text-warning-500" />
      case "wrong":
        return <X {...iconProps} className="text-danger-500" />
      case "solved":
        return <CheckFat {...iconProps} className="text-success-500" />
      case "past":
        return <ArrowClockwise {...iconProps} className="text-secondary-500" />
      case "all":
        return <CheckCircle {...iconProps} className="text-primary-500" />
      default:
        return null
    }
  }

  const categoryOptions = [
    { value: "unsolved", label: "Unsolved MCQ" },
    { value: "wrong", label: "Wrong MCQ" },
    { value: "solved", label: "Correct MCQ" },
    { value: "past", label: "Past MCQ" },
    { value: "all", label: "All MCQ" },
  ]

  return (
    <div className="mx-auto py-8 md:max-w-5xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple rounded-2xl py-4 px-6 shadow-lg">
          SELECT YOUR TOPIC
        </h1>
      </div>

      {/* Main Content Card */}
      <Card fullWidth className="w-full px-0  shadow-none border-none">
        <CardHeader className="flex justify-center pb-2">
          <Chip
            size="lg"
            color="primary"
            variant="solid"
            className="text-lg font-bold capitalize px-6 py-2 shadow-md"
          >
            {chapterName}
          </Chip>
        </CardHeader>

        <CardBody  className="gap-6 px-0">
          {/* Category Selection */}
          {chapterName !== "mock" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-foreground-700">Select Category</h3>
              <RadioGroup
                value={category}
                onValueChange={setCategory}
                orientation="horizontal"
                className="flex flex-wrap justify-center gap-2 md:gap-4"
                classNames={{
                  wrapper: "gap-4"
                }}
              >
                {categoryOptions.map((option) => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    className="flex-shrink-0"
                    classNames={{
                      base: "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between flex-row-reverse cursor-pointer rounded-lg gap-2 md:p-3 border-2 border-transparent data-[selected=true]:border-primary",
                      wrapper: "hidden"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {getIcon(option.value)}
                      <span className="font-medium text-foreground">{option.label}</span>
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Divider */}
          <hr className="border-divider" />

          {/* Topic Selection */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-primary">Select Topic</h3>

            <Accordion
              variant="bordered"
              defaultExpandedKeys={["topics"]}
              className="shadow-sm px-2 md:px-4"
              fullWidth
            >
              <AccordionItem
                key="topics"
                aria-label="Topics"
                title={
                  <span className="font-bold text-lg text-center text-foreground-700">
                    Expand Topics ({topics.length} available)
                  </span>
                }
                className="font-semibold"
                classNames={{
                  title: "text-lg font-bold",
                  content: "pt-2"
                }}
              >
                <RadioGroup
                  value={selectedTopic}
                  onValueChange={setSelectedTopic}
                  className="gap-3"
                  classNames={{
                    wrapper: "gap-3"
                  }}
                  
                >
                  {topics.map((topic, index) => (
                    <Radio
                      key={index}
                      value={topic}
                      className="w-full"
                      classNames={{
                        base: "flex m-0 bg-content1 hover:bg-content2 items-center max-w-full cursor-pointer rounded-lg gap-4 p-3 border-2 border-transparent data-[selected=true]:bg-green/30 data-[selected=true]:border-success/50",
                        wrapper: "hidden",
                      }}
                    >
                      <div className="flex items-center gap-2 justify-between w-full">
                        <span className="font-medium text-sm md:text-medium text-foreground">{topic}</span>
                      </div>
                    </Radio>
                  ))}


                </RadioGroup>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4">
            <Button
              color="primary"
              size="lg"
              isDisabled={!(selectedTopic && category)}
              onClick={handleNextClick}
              className="font-semibold px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              Next
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Alert Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        placement="center"
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
        }}
      >
        <ModalContent className="shadow-2xl">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Warning size={24} weight="duotone" className="text-warning-500" />
              <span className="text-xl font-bold">MCQs Not Available 🌟</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-foreground-600">
              {`${category} MCQ's are not available yet! Please try another category or topic.`}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              onPress={onClose}
              className="font-semibold"
            >
              Try Another
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default Page
