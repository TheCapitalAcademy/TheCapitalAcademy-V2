import React, { useRef } from 'react'
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y, Autoplay } from 'swiper/modules';

import './pricing.scss'
import 'swiper/css';
import 'swiper/css/pagination';

import png1 from '/courses/1.png'
import png2 from '/courses/2.png'
import png3 from '/courses/3.png'
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '../../baseUrl.js';


const Pricing = () => {
    const swiperRef = useRef();
    const [data, setData] = useState({});
    const [mdcatData, setMdcatData] = useState('');
    const [numsData, setNumsData] = useState('');
    const [mdcatNumsData, setMdcatNumsData] = useState('');

    const [mdcatPrice, setMdcatPrice] = useState(0);
    const [numsPrice, setNumsPrice] = useState(0);
    const [mdcatNumsPrice, setMdcatNumsPrice] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/course/all');
                if (response) {
                    response?.data?.map((e) => {
                        if (e?.cname == "mdcat") {
                            setMdcatData(e?.cdesc?.split(' ')?.slice(0, 10)?.join(' '));
                            setMdcatPrice(e?.cprice);
                        }
                        else if (e.cname == "nums") {
                            setNumsData(e?.cdesc?.split(' ')?.slice(0, 10)?.join(' '))
                            setNumsPrice(e?.cprice);
                        }
                        else if (e.cname == "mdcat+nums") {
                            setMdcatNumsData(e?.cdesc?.split(' ')?.slice(0, 10)?.join(' '))
                            setMdcatNumsPrice(e?.cprice);
                        }
                    })
                }
            } catch (error) {

            }
        }

        fetchData()
    }, [])

    return (
        <div className="pricing mt-5 py-5">
            <div className="container">
                <div className="heading mb-4">
                    <div className="left">
                        <h2 className='fw-bold fs-2 text-dark'>Explore Our Online Courses</h2>
                    </div>
                    <div className="right ">
                        <button onClick={() => swiperRef.current.slidePrev()} name='back' aria-label="back">
                            <svg width="23px" height="33px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M11.7071 4.29289C12.0976 4.68342 12.0976 5.31658 11.7071 5.70711L6.41421 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H6.41421L11.7071 18.2929C12.0976 18.6834 12.0976 19.3166 11.7071 19.7071C11.3166 20.0976 10.6834 20.0976 10.2929 19.7071L3.29289 12.7071C3.10536 12.5196 3 12.2652 3 12C3 11.7348 3.10536 11.4804 3.29289 11.2929L10.2929 4.29289C10.6834 3.90237 11.3166 3.90237 11.7071 4.29289Z" fill="#000000" />
                            </svg>
                        </button>
                        <button onClick={() => swiperRef.current.slideNext()} name='next' aria-label="next">
                            <svg width="23px" height="33px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12.2929 4.29289C12.6834 3.90237 13.3166 3.90237 13.7071 4.29289L20.7071 11.2929C21.0976 11.6834 21.0976 12.3166 20.7071 12.7071L13.7071 19.7071C13.3166 20.0976 12.6834 20.0976 12.2929 19.7071C11.9024 19.3166 11.9024 18.6834 12.2929 18.2929L17.5858 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H17.5858L12.2929 5.70711C11.9024 5.31658 11.9024 4.68342 12.2929 4.29289Z" fill="#000000" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="row p-2 mb-3  ">
                    <div className="col-md-10 offset-md-1">
                        <Swiper
                            className='pb-5'
                            modules={[Pagination, Autoplay]}
                            onSwiper={(swiper) => {
                                swiperRef.current = swiper;
                            }}
                            loop={true}
                            autoplay={{
                                delay: 3000,
                                disableOnInteraction: false
                            }}
                            spaceBetween={60}
                            navigation
                            pagination={{ clickable: true }}
                            slidesPerView={2}
                            breakpoints={{
                                230: {
                                    slidesPerView: 1, // Show 2 slides on screens wider than 640px
                                },

                                1024: {
                                    spaceBetwee: 0,
                                    slidesPerView: 2, // Show 3 slides on screens wider than 1024px
                                },
                            }}
                        >
                            {/* Mdcat swiper/\ */}
                            <SwiperSlide className='d-flex justify-content-center '>
                                <Link to={{ pathname: "/checkout", search: "?course=mdcat" }}>
                                    <div className="course-card mb-2 col-md-12">
                                        <div>
                                            <div className="top pt-2">
                                                <img src={png1} alt="" />
                                            </div>
                                            <div className="bottom">
                                                <div className="catagory">{mdcatPrice}</div>
                                                <div className="title"><h5 className='fw-bold  text-gray-800'>MDCAT McQs Bank</h5></div>
                                                <div className="details py-2">
                                                    <ul>
                                                        <li className='d-flex gap-1 pb-3'>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="25px"><path fill="#c8e6c9" d="M36,42H12c-3.314,0-6-2.686-6-6V12c0-3.314,2.686-6,6-6h24c3.314,0,6,2.686,6,6v24C42,39.314,39.314,42,36,42z" /><path fill="#4caf50" d="M34.585 14.586L21.014 28.172 15.413 22.584 12.587 25.416 21.019 33.828 37.415 17.414z" /></svg>
                                                            <span style={{ height: "auto", whiteSpace: 'pre-line' }} className='px-1'>
                                                                {mdcatData}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </SwiperSlide>
                            <SwiperSlide className='d-flex justify-content-center'>
                                <div className="course-card mb-2 col-md-12">
                                    <Link to={{ pathname: "/checkout", search: "?course=nums" }}>
                                        <div>
                                            <div className="top pt-2">
                                                <img src={png2} alt="" />
                                            </div>
                                            <div className="bottom">
                                                <div className="catagory">{numsPrice}</div>
                                                <div className="title"><h5 className='fw-bold  text-gray-800'>NUMS McQs Bank</h5></div>
                                                <div className="details py-2">
                                                    <ul>
                                                        <li className='d-flex gap-1 pb-3'>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="25px"><path fill="#c8e6c9" d="M36,42H12c-3.314,0-6-2.686-6-6V12c0-3.314,2.686-6,6-6h24c3.314,0,6,2.686,6,6v24C42,39.314,39.314,42,36,42z" /><path fill="#4caf50" d="M34.585 14.586L21.014 28.172 15.413 22.584 12.587 25.416 21.019 33.828 37.415 17.414z" /></svg>
                                                            <span style={{ height: "8px" }} className='px-1'>
                                                                {numsData}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </SwiperSlide>
                            <SwiperSlide className='d-flex justify-content-center'>
                                <Link to={{ pathname: "/checkout", search: "?course=mdcat%2Bnums" }}>
                                    <div className="course-card mb-2 col-md-12">
                                        <div>
                                            <div className="top pt-2">
                                                <img src={png3} alt="" />
                                            </div>
                                            <div className="bottom">
                                                <div className="catagory">{mdcatNumsPrice}</div>
                                                <div className="title"><h5 className='fw-bold  text-gray-800'>MDCAT+NUMS McQs Bank</h5></div>
                                                <div className="details py-2">
                                                    <ul>
                                                        <li className='d-flex gap-1 pb-3'>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22px" height="25px"><path fill="#c8e6c9" d="M36,42H12c-3.314,0-6-2.686-6-6V12c0-3.314,2.686-6,6-6h24c3.314,0,6,2.686,6,6v24C42,39.314,39.314,42,36,42z" /><path fill="#4caf50" d="M34.585 14.586L21.014 28.172 15.413 22.584 12.587 25.416 21.019 33.828 37.415 17.414z" /></svg>
                                                            <span style={{ height: "8px" }} className='px-1'>
                                                                {mdcatNumsData}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </SwiperSlide>

                        </Swiper>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Pricing