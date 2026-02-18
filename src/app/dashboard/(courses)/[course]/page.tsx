
// import './subjectpage.scss';
import { redirect } from 'next/navigation'
import Subject from '@/components/dashboard/Subject';
import Axios from '@/lib/Axios';


export const metadata = {
    title: "Select Subject",
    description: `Select a subject to start your preparation for the course.`,
  };


const Page = async ({ params }) => {
    const { course } = params;
    let data = [];

    const res = await Axios.get('/api/v1/course/active-courses');
    const activeCourses = res.data.activeCourses;
    if (!activeCourses.includes(course)) {
        return redirect('/dashboard')
    }

    const bio = '/subjects/1.png'
    const chem = '/subjects/2.png';
    const phy = '/subjects/3.png';
    const eng = '/subjects/4.png';
    const logic = '/subjects/5.png';
    const mock = '/subjects/6.png';


    const numsSubjectData = [
        {
            name: "BIOLOGY",
            img: bio,
            link: '/dashboard/nums/biology'
        },
        {
            name: "CHEMISTRY",
            img: chem,
            link: '/dashboard/nums/chemistry'
        },
        {
            name: "PHYSICS",
            img: phy,
            link: '/dashboard/nums/physics'
        },
        {
            name: "ENGLISH",
            img: eng,
            link: '/dashboard/nums/english'
        },
        {
            name: "MOCK TESTS",
            img: mock,
            link: '/dashboard/nums/mock/test'
        },
    ];

    const mdcatSubjectData = [
        {
            name: "BIOLOGY",
            img: bio,
            link: '/dashboard/mdcat/biology'
        },
        {
            name: "CHEMISTRY",
            img: chem,
            link: '/dashboard/mdcat/chemistry'
        },
        {
            name: "PHYSICS",
            img: phy,
            link: '/dashboard/mdcat/physics'
        },
        {
            name: "ENGLISH",
            img: eng,
            link: '/dashboard/mdcat/english'
        },
        {
            name: "LOGICAL REASONING",
            img: logic,
            link: '/dashboard/mdcat/logic'
        },
        {
            name: "MOCK TESTS",
            img: mock,
            link: '/dashboard/mdcat/mock/test'
        },
    ];


    const mdcatNumsSubjectData = [
        {
            name: "BIOLOGY",
            img: bio,
            link: '/dashboard/mdcatNums/biology'
        },
        {
            name: "CHEMISTRY",
            img: chem,
            link: '/dashboard/mdcatNums/chemistry'
        },
        {
            name: "PHYSICS",
            img: phy,
            link: '/dashboard/mdcatNums/physics'
        },
        {
            name: "ENGLISH",
            img: eng,
            link: '/dashboard/mdcatNums/english'
        },
        {
            name: "LOGICAL REASONING",
            img: logic,
            link: '/dashboard/mdcatNums/logic'
        },
        {
            name: "MOCK TESTS",
            img: mock,
            link: '/dashboard/mdcatNums/mock/test'
        },
    ];

    if (course === "nums") {
        data = numsSubjectData;
    } else if (course === "mdcat") {
        data = mdcatSubjectData;
    } else if (course === "mdcatNums") {
        data = mdcatNumsSubjectData;
    } else if (course == "trial") {
        data = [
            {
                name: "BIOLOGY",
                img: bio,
                link: '/dashboard/trial/biology'
            },
            {
                name: "CHEMISTRY",
                img: chem,
                link: '/dashboard/trial/chemistry'
            },
            {
                name: "PHYSICS",
                img: phy,
                link: '/dashboard/trial/physics'
            },
            {
                name: "ENGLISH",
                img: eng,
                link: '/dashboard/trial/english'
            },
            {
                name: "LOGICAL REASONING",
                img: logic,
                link: '/dashboard/trial/logic'
            }
        ]
    }

    return (
        <>
            <div className="h-full w-full flex flex-col items-center justify-center md:p-4">
                <div className="flex justify-center pb-10">
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple  to-pink bg-clip-text text-transparent">
                        SELECT YOUR SUBJECT
                    </h1>
                </div>
                {
                    data.length == 0 &&
                    <p> not subject are here</p>
                }
                <div className="flex mx-auto flex-wrap gap-x-3 gap-y-4 md:gap-4  justify-start">
                    {data.map((ele, index) => (
                        <Subject key={index} name={ele.name} img={ele.img} isLocked={(false) ? ele.name == 'MOCK TESTS' : false} link={(false) ? ele.name == 'MOCK TESTS' ? '#' : ele.link : ele.link} />
                    ))}
                </div>
            </div>
        </>
    );
};

export default Page;
