
import Header from '@/components/header/Header';
import HomeCard from '@/components/home-card/Home_card';
import Boards from '@/components/board/Boards';
import Pricing from '@/components/pricing/Pricing';
import Features from '@/components/features/Features';
import Reviews from '@/components/review/Review';
import FAQAccordion from '@/components/Faqs/Faqs';
import Axios from '@/lib/Axios';

// Revalidate every 60 seconds — avoids re-fetching on every single page load
export const revalidate = 60;





export default async function Home() {
    let reviews = [];
    let isActiveCourse = false;
    try {
        // Fetch in parallel instead of sequentially to cut load time in half
        const [reviewRes, courseRes] = await Promise.all([
            Axios.get('/api/v1/review'),
            Axios.get('/api/v1/course/active-courses'),
        ]);
        reviews = reviewRes.data;
        const activeCourses = courseRes?.data?.activeCourses;
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
        </>
    )
}
