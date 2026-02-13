
import Header from '@/components/header/Header';
import HomeCard from '@/components/home-card/Home_card';
import Boards from '@/components/board/Boards';
import Pricing from '@/components/pricing/Pricing';
import Features from '@/components/features/Features';
import Reviews from '@/components/review/Review';
import FAQAccordion from '@/components/Faqs/Faqs';
import CapyAIChat from '@/components/home/CapyAIChat';
import Axios from '@/lib/Axios';





export default async function Home() {
    let reviews = [];
    let isActiveCourse = false;
    try {
        const res = await Axios.get('/api/v1/review');
        reviews = res.data;

        const response = await Axios.get('/api/v1/course/active-courses');
        const activeCourses = response?.data?.activeCourses;
        if (activeCourses && activeCourses.length > 0) {
            isActiveCourse = true;
        }
    } catch (error) {
        console.log(error)
    }

    return (
        <>
            <Header isActiveCourse={isActiveCourse} />
            <Pricing />
            <HomeCard />
            <Boards />
            <Features />
            <Reviews reviews={reviews} />
            <FAQAccordion />
            <CapyAIChat />
        </>
    )
}
