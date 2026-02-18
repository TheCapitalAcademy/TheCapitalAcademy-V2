import Chapter from "@/components/dashboard/Chapters";
import { mdcatBioChapters, mdcatChemistryChapters, mdcatEnglishChapters, mdcatLogicChapter, mdcatPhysicsChapters, numsBioChapters, numsChemistryChapters, numsEnglishChapters, numsPhysicsChapters } from "@/data/chaperts";
import { notFound } from "next/navigation";



export const metadata = {
    title: "Chapters",
    description: `View and manage your enrolled courses.`,
  };


const Page = async ({ params }) => {
    const { course, subject } = await params;
    console.log(course, subject);
    console.log(params);
    if (!['nums', 'mdcat', 'trial', 'mdcatNums'].includes(course)) {
        notFound();
    }
    let chapters = []

    if (course === 'nums') {
        if (subject == 'biology') {
            chapters = numsBioChapters;
        } else if (subject == 'chemistry') {
            chapters = numsChemistryChapters;
        } else if (subject == 'physics') {
            chapters = numsPhysicsChapters;
        } else if (subject == 'english') {
            chapters = numsEnglishChapters;
        }
    } else if (course === 'mdcat') {
        if (subject == 'biology') {
            chapters = mdcatBioChapters;
        } else if (subject == 'chemistry') {
            chapters = mdcatChemistryChapters;
        } else if (subject == 'physics') {
            chapters = mdcatPhysicsChapters;
        } else if (subject == 'english') {
            chapters = mdcatEnglishChapters;
        } else if (subject == 'logic') {
            chapters = mdcatLogicChapter;
        }
    } else if (course === 'mdcatNums') {
        // Combo: Bio, Chem, Physics, English from NUMS; Logic from MDCAT
        if (subject == 'biology') {
            chapters = numsBioChapters;
        } else if (subject == 'chemistry') {
            chapters = numsChemistryChapters;
        } else if (subject == 'physics') {
            chapters = numsPhysicsChapters;
        } else if (subject == 'english') {
            chapters = numsEnglishChapters;
        } else if (subject == 'logic') {
            chapters = mdcatLogicChapter;
        }
    } else if (course === 'trial') {
        if (subject == 'biology') {
            chapters = mdcatBioChapters;
        } else if (subject == 'chemistry') {
            chapters = mdcatChemistryChapters;
        } else if (subject == 'physics') {
            chapters = mdcatPhysicsChapters;
        } else if (subject == 'english') {
            chapters = mdcatEnglishChapters;
        } else if (subject == 'logic') {
            chapters = mdcatLogicChapter;
        }
    }



    return (
        <div className="">
            <div className="w-full">
                <div className="flex justify-center pb-10">
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple  to-pink bg-clip-text text-transparent">
                        SELECT YOUR CHAPTER
                    </h1>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4 justify-center w-full">
                    {chapters.map((ele, index) => (
                        <Chapter course={course} subject={subject} chapter={ele.name} key={index} name={ele.name} img={ele.image} isLocked={ele.locked ?? false} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Page