import React, { useEffect, useRef, useState } from 'react'
import './mcqs.scss'
import './resultModel.scss'
import LinearProgress from '@mui/material/LinearProgress';
import { ArrowBack, Bookmark, Close, Flag, Grading, KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight, Save, SaveAlt, ShowChart } from '@mui/icons-material';
import { Button, Form, Modal } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { IconButton } from '@mui/material';
import { closeSnackbar, useSnackbar } from 'notistack';
import FsLightbox from 'fslightbox-react';
import Timer from '../timer/Timer';

import { MathJax, MathJaxContext } from "better-react-mathjax";
import axiosInstance from '../../baseUrl.js';

const Mcqs = () => {
	const navigate = useNavigate();
	const location = useLocation()
	const { course, subject, chapter, topic, catagory } = location.state || {}
	const [correctMcq, setCorrectMcq] = useState([]);
	const [wrongMcq, setWrongMcq] = useState([]);
	const [attempted, setAttempted] = useState([]);
	const [showMockModel, setShowMockModel] = useState(false);
	const [loading, setLoading] = useState(false);


	const [lightboxController, setLightboxController] = useState({
		toggler: false,
		sourceIndex: 0
	});

	const toggleLightbox = () => {
		setLightboxController({
			...lightboxController,
			toggler: !lightboxController.toggler
		});
	};

	const [data, setData] = useState([]);
	const [mcqs, setMcqs] = useState([]);
	const [user, setUser] = useState(useSelector((state) => state.auth?.user?.user?.user));
	const { enqueueSnackbar } = useSnackbar();
	const [sideBarOpen, setSidebarOpen] = useState(false);

	const [bioCorrectCout, setBioCorrectCount] = useState(0);
	const [chemCorrectCout, setChemCorrectCount] = useState(0);
	const [phyCorrectCount, setPhyCorrectCount] = useState(0);
	const [engCorrectCount, setEngCorrectCount] = useState(0);
	const [logicCorrectCount, setLogicCorrectCount] = useState(0);
	const [mockPercentageCount, setMockPercentageCout] = useState(0);
	const [showResultModel, setShowResultModel] = useState(false);




	//center snackbar
	const showCenteredSnackbar = (message, variant) => {
		enqueueSnackbar(message, {
			variant: variant,
			autoHideDuration: 4000,
			anchorOrigin: {
				vertical: 'top',
				horizontal: 'center',
			},
			action: (
				<IconButton size="small" aria-label="close" color="inherit" onClick={() => closeSnackbar()}>
					<Close fontSize="small" />
				</IconButton>
			)
		});
	};

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				const response = await axiosInstance.post('/mcq/get', { course, subject, chapter, topic, catagory, userId: user._id });
				setData(response.data || []);
				setLoading(false);
			} catch (error) {
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	useEffect(() => {
		setMcqs(data?.map((mcq) => ({ ...mcq, selected: null, lock: false })));
	}, [data])

	//mcqs data saved on database
	const saveMcqData = async () => {
		if (correctMcq.length > 0 || wrongMcq.length > 0) {
			try {
				if (subject === 'mock') {
					return navigate(-1)
				}
				let response = await axiosInstance.put('/mcq/solved', { correctMcq, wrongMcq, userId: user._id });
				if (response.data.acknowledged) {
					// showCenteredSnackbar("MCQ Data Saved", 'success');
					// setCorrectMcq([]);
					// setWrongMcq([]);
					showCenteredSnackbar("Check Stats In Dashboard", 'success');
				}
			} catch (error) { }
		} else {
			showCenteredSnackbar("Solved MCQ's Saved", 'info');
		}
	}

	const handleBookmarked = async () => {
		console.log(mcqs[index]._id)
		const res=await axiosInstance.put('/mcq/bookmark', { mcqId: mcqs[index]._id });
		if (res.status == 200) {
			showCenteredSnackbar("MCQ Bookmarked", 'success');
		}
		else {
			showCenteredSnackbar("Something Went Wrong", 'error');
		}
	}

	const [index, setIndex] = useState(0);
	const alphabets = ["A", "B", "C", "D"];
	const [isFlip, setIsFlip] = useState(false);

	//model states & handlers
	const [testStart, setTestStart] = useState(true);
	const [isReportModalOpen, setisReportModalOpen] = useState(false);
	const [reportData, setReportData] = useState({msg: ""});
	const handleReportChange = (e) => {
		const { name, value } = e.target;
		// setReportData({ ...reportData, [name]: value, userId: user._id, question: mcqs[index]?.question });
		setReportData({ ...reportData, [name]: value, question: mcqs[index]?.question });
	}

	// =============handle Report==========================
	const handleReport = async () => {
		if (reportData.msg == "") {
			showCenteredSnackbar("Reson is required field", "info");
			return;
		}
		try {
			const response = await axiosInstance.post('/report', reportData);
			if (response.status == 201) {
				setisReportModalOpen(false);
				setReportData({msg: ""});
				showCenteredSnackbar("We will review it shortly", "success");
			}
			else {
				showCenteredSnackbar("Something Went Wrong", "error");
			}
		} catch (error) {
			showCenteredSnackbar("Something Went Wrong", "error");
		}
	}

	//ref for options
	let ref1 = useRef();
	let ref2 = useRef();
	let ref3 = useRef();
	let ref4 = useRef();
	const refArray = [ref1, ref2, ref3, ref4];
	useEffect(() => {
		if (mcqs[index]?.selected != null) {
			if (mcqs[index].correctOption === mcqs[index].selected) {
				refArray[mcqs[index].selected - 1].current.classList.add('correct');
			}
			else {
				refArray[mcqs[index].selected - 1].current.classList.add('wrong');
			}
		}
	}, [mcqs, index])

	//check	answer
	const checkAns = (e, ans) => {
		if (mcqs[index].lock == false) {
			setMcqs(prevMcqs => {
				const updatedMcqs = [...prevMcqs];
				updatedMcqs[index].lock = true;
				updatedMcqs[index].selected = ans;
				return updatedMcqs;
			});
			if (mcqs[index].correctOption == ans) {
				e.target.classList.add('correct');
				setCorrectMcq((prevMcq) => [...prevMcq, mcqs[index]._id]);
				setAttempted([...attempted, index]);

				//checkMockPercentage
				if (subject == 'mock') {
					if (index < 68) {
						setBioCorrectCount((e) => e + 1);
					} else if (index < 122) {
						setChemCorrectCount((e) => e + 1);
					} else if (index < 176) {
						setPhyCorrectCount((e) => e + 1);
					} else if (index < 194) {
						setEngCorrectCount((e) => e + 1);
					} else if (index < 200) {
						setLogicCorrectCount((e) => e + 1);
					}
				}
			}
			else {
				mcqs[index].lock = true;
				e.target.classList.add('wrong');
				refArray[mcqs[index].correctOption - 1].current.classList.add('correct');
				setWrongMcq((prevMcq) => [...prevMcq, mcqs[index]._id]);
			}
		}
		else {
			// console.log("locked")
		}
	}

	//next answer
	const nextOption = () => {
		setIsFlip(false);
		if (index < mcqs?.length - 1) {
			setIndex(index + 1);
			refArray.map((e) => {
				e.current.classList.remove('correct');
				e.current.classList.remove('wrong');
			})
		}
		else {
			if (subject === 'mock') {
				setMockPercentageCout(bioCorrectCout + phyCorrectCount + chemCorrectCout + engCorrectCount + logicCorrectCount);
				return showMockResult()

			}
			showMockResult()
			saveMcqData(); ///mcq data saved if length end of array
		}
	}

	const showMockResult = () => {
		setSidebarOpen(false);
		setShowMockModel(true)
	}
	//prev answe
	const prevOption = () => {
		setIsFlip(false);
		if (index > 0) {
			setIndex(index - 1)
			refArray.map((e) => {
				e.current.classList.remove('wrong');
				e.current.classList.remove('correct');
				return null;
			})
		}
		else {
			setIndex(0);
		}
	}

	const handleSetIndex = (i) => {
		setIsFlip(false);
		setIndex(i)
		refArray.map((e) => {
			e.current.classList.remove('wrong');
			e.current.classList.remove('correct');
			return null;
		})
	}

	const handleSaveAndExit = () => {
		if (subject == 'mock') {
			return navigate(-1);
		}
		saveMcqData();
	}

	const handleFlip = () => {
		const da = mcqs[index];
		if (da.lock) {
			setIsFlip(!isFlip)
		}
		else {
			showCenteredSnackbar("Attempt McQ To See Explaination", 'info')
		}
	}

	const handleMockPreview = () => {
		setShowResultModel(true);
	}
	const config = {
		loader: { load: ['[tex]/ams'] },
		tex: {
			inlineMath: [['$', '$'], ['\\(', '\\)']],
			displayMath: [['$$', '$$'], ['\\[', '\\]']],
		},
	};




	return (
		<MathJaxContext version={3} config={config}>
			<div className="mcqs">
				<div className="container">
					<div className="mcq-topbar">
						<div className='top'>
							<div className="left bg-gray-300 px-2 py-1 text-primary d-flex align-item-center back-btn" onClick={() => navigate(-1)}>
								<ArrowBack />Back
							</div>
							<div className="right bg-gray-300 px-2 py-1 text-primary d-flex align-item-center back-btn" onClick={handleSaveAndExit}>
								<Save className='me-1 fw-bold' />  Save & Exit
							</div>
						</div>
						<div className='bottom my-3'>
							<LinearProgress style={{ root: { height: '133px' }, background: 'lightblue' }} valueBuffer={70} size={88} thickness={99} variant="buffer" value={(((index + 1) / mcqs.length) * 100)} />
						</div>
					</div>


					{/* // Timer start here */}
					{
						subject === 'mock' &&
						<div className="row"  >
							<div className="container w-auto rounded-5 px-4 py-1 shadow-sm mb-1 fs-2 fw-bolder" style={{ color: "#2F6DC3", background: '#EDECff', fontFamily: 'fredoka' }}>
								{
									loading ? <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Calculating time...</span> :
										<Timer initialTimeInMinutes={150} handleSaveAndExit={handleSaveAndExit} />
								}
							</div>
						</div>
					}


					{/* //sidebar mcqs stats */}
					<div className="container-fluid mcq-container">
						<div className="mcq-stats" style={sideBarOpen ? { left: 0 } : {}}>
							<div className="row gap-1 gy-1 justify-content-center">
								{
									mcqs.map((e, i) => (
										<div
											key={i}
											onClick={() => handleSetIndex(i)}
											style={{
												background: wrongMcq.includes(e._id)
													? '#FF9188'
													: correctMcq.includes(e._id)
														? '#17B169'
														: i === index
															? '#DDDFEB'
															: '',
												color: (correctMcq.includes(e._id) || wrongMcq.includes(e._id))
													? 'white'
													: i === index
														? '#5E8AFF'
														: '#1110107c',
											}}
											className="mcq-stat-box col-2 py-1 col-md-2 p-0 shadow-sm"
										>
											{i + 1}
										</div>
									))


								}
							</div>
						</div>

						{/* //Mcqs box */}
						<div className="mcq-box">
							<div className="top-box">
								<div className="left">
									<span>Question {index + 1}/{mcqs?.length}</span>
									{mcqs[index]?.info && <span className='text-capitalize'>{mcqs[index]?.info}</span>}
								</div>

								<div className="right">
									{/* {mcqs[index]?.category == 'past' && <span className="text text-capitalize">{mcqs[index]?.category}</span>} */}
									<span className="text text-capitalize">{mcqs[index]?.difficulty == 'medium' ? "Moderate" : mcqs[index]?.difficulty}</span>
									<span className="text bookmark-button" title='Save MCQ' onClick={handleBookmarked}><Bookmark /></span>
								</div>
							</div>


							{/* =================mcqs start from here====================<span>({String.fromCharCode(index+65)})</span>   */}

							<div className={"middle-box"} style={{ animation: 'slide-in 0.7s forwards' }}>
								<div className="heading">
									<h3 style={{ color: '#454545' }}><span className='fw-bold' style={{ color: '#1F63BE' }}>Question:</span> <MathJax dynamic={true} style={{ color: '#454545', fontSize: '21px' }} inline>{mcqs[index]?.question}</MathJax></h3>
								</div>
								{
									loading ? <div style={{ height: '330px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Please wait a moment...</div> :
										<div className="options">
											<div className="optionss ">
												<div className="card">
													<div className={`card-inner ${isFlip && "box-flip"}`}>
														{
															<>
																<div className="mcq-card-front">
																	<ul style={{ height: '90%' }}>
																		{
																			mcqs[index]?.options.map((e, index) => (
																				<li key={index} ref={refArray[index]} onClick={(e) => { checkAns(e, ++index) }}>
																					<span className='me-2 text-gray' style={{ userSelect: 'none', pointerEvents: 'none' }}>{alphabets[index]})</span>
																					<MathJax dynamic={true} style={{ userSelect: 'none', pointerEvents: 'none' }} inline>{e}</MathJax>
																				</li>
																			))
																		}
																	</ul>
																</div>
																<div className="card-back">
																	<div className="container-fluid">
																		<div className="row py-md-1	 mt-md-2 mt-1">
																			<div className="col-md-8 col-12">
																				<div className="title text-primary fw-bold">Explaination</div>
																				<div style={{ fontSize: "15.6px", whiteSpace: 'pre-line' }} className='pl-md-0'>
																					<MathJax dynamic hideUntilTypeset="first">
																						{mcqs[index]?.explain ? `$${mcqs[index]?.explain}$` : ''}
																					</MathJax>
																				</div>
																				{!mcqs[index]?.explain && <p>Not Available yet</p>}
																			</div>
																			<div className="col-md-4 col-12">
																				<div className="title text-primary fw-bold">Image</div>
																				<img

																					height={150}
																					onClick={toggleLightbox}
																					style={{ cursor: 'pointer' }}
																					className='mt-3 top-0 position-sticky'
																					src={mcqs[index]?.imageUrl}
																					alt=""
																				/>
																			</div>
																		</div>
																	</div>
																</div>
															</>
														}
													</div>
												</div>
											</div>
										</div>
								}
							</div>


							{/*===================== mcqs end here && explain Image light box================= */}
							<div className="toggle-box">
								<FsLightbox
									toggler={lightboxController.toggler}
									sources={[mcqs[index]?.imageUrl]}
									zoomIncrement={0.1}
								/>
							</div>


							{/* =========================Report Start here ============== */}
							<Modal show={isReportModalOpen} className="rounded-modal">
								<div className='rounded-5 overflow-hidden'>
								<Modal.Header>
									<Modal.Title className='text-danger fw-semiBold'>Report MCQ</Modal.Title>
								</Modal.Header>
								<Modal.Body>
									<Form>
										<Form.Group
											className="mb-3"
											controlId="exampleForm.ControlTextarea1"
										>
											<Form.Label>Reason (required)</Form.Label>
											<Form.Control as="textarea" required rows={3} name='msg' onChange={handleReportChange} />
										</Form.Group>
									</Form>
								</Modal.Body>
								<Modal.Footer>
									<Button variant="secondary" onClick={() => setisReportModalOpen(!isReportModalOpen)}>
										Close
									</Button>
									<Button variant="danger" onClick={handleReport}>
										Report
									</Button>
								</Modal.Footer>
								</div>
							</Modal>
							{/* =========================Report End here ============== */}

							<div className="bottom-box">
								<button onClick={prevOption} className='back-btn'>
									<KeyboardDoubleArrowLeft />
								</button>
								<button className='report-btn' style={{
									background: isReportModalOpen ? '#1E5fbb' : "none",
									borderRadius: '2rem'
								}}
									onClick={() => setisReportModalOpen(!isReportModalOpen)}>
									<Flag
										style={{
											color: isReportModalOpen ? '#ffff' : '#F9847C'
										}}
									/>
								</button>
								{
									chapter !== 'test' &&
									<button className='explain-btn' onClick={handleFlip}>
										<span>{isFlip ? "Question" : "Explaination"}</span>
									</button>
								}
								<button className='view-btn'
									style={{
										background: sideBarOpen ? '#1E5fbb' : "none",
										borderRadius: '2rem'
									}} onClick={() => setSidebarOpen(!sideBarOpen)}>
									<Grading
										style={{
											color: sideBarOpen ? '#ffff' : '#F9847C'
										}}
									/>
								</button>
								{
									subject === 'mock' ?
										<button onClick={nextOption} className='next-btn'>
											{(index == mcqs?.length - 1) ? <>View Result</> : < KeyboardDoubleArrowRight />}
										</button>
										:
										<button onClick={nextOption} className='next-btn'>
											{(index == mcqs?.length - 1) ? <>Submit</> : < KeyboardDoubleArrowRight />}
										</button>
								}
							</div>
						</div>
					</div>
				</div>

				<Modal show={testStart} fullscreen={true} className='ps-0' dialogClassName="modal-100w">
					<Modal.Body className='mcq-model-body'>
						<div className="box">
							<div className="instructions shadow-lg">
								<h3>Instructions</h3>
								<ul>
									<li>You can select only one option</li>
									<li>Once an option is selected, it can't be changed later</li>
									<li>You can solve only {subject == 'mock' ? '200' : '100'} McQs in one go</li>
									<li>{subject == 'mock' ?
										"Check Mock-test result after completion"
										: 'Your data will enter the stats only if you submit or save the test'
									}</li>
								</ul>
								<div className="button-box  w-auto p-2 mt-4">
									<button className='quit' onClick={() => navigate(-1)}>Quit</button>
									<button className='start' onClick={() => setTestStart(false)}>Start Test</button>
								</div>
							</div>
						</div>
					</Modal.Body>
				</Modal>

				{/* //result model box */}
				<Modal show={showMockModel} fullscreen={true} className='ps-0 Result-Model-box' dialogClassName="modal-100w">
					<Modal.Body className='mcq-model-body'>
						<div class="grid-container">
							<div class="banner-left">
								<p class="your-result">Your Result</p>

								<div class="circle">
									<b> {subject == 'mock' ? mockPercentageCount : correctMcq.length}</b>
									<p>of {mcqs?.length}</p>
								</div>

								<div class="Result-summary">
									<h4 className='fw-bold'>
										{
											subject == 'mock' ? (mockPercentageCount < 100 ? 'Needs Improvement' :
												(mockPercentageCount < 150) ? 'Satisfactory' : 'Excellent') :
												(correctMcq.length < mcqs.length / 2 ? 'Needs Improvement' :
													(correctMcq.length < mcqs.length / 1.33) ? 'Satisfactory' : 'Excellent')
										}
									</h4>
									<p>
										{
											subject == 'mock' ? mockPercentageCount < 100 ? ' Consider utilizing tutoring resources and dedicating more time to study and practice.' :
												(mockPercentageCount < 150) ? 'Your performance is satisfactory, but there is potential for improvement. ' :
													'You have demonstrated an excellent understanding of the material.' :
												(correctMcq.length < mcqs.length / 2 ? 'Consider utilizing tutoring resources and dedicating more time to study and practice.' :
													(correctMcq.length < mcqs.length / 1.33) ? 'Your performance is satisfactory, but there is potential for improvement.' : 'You have demonstrated an excellent understanding of the material.')
										}
									</p>
								</div>

							</div>
							<div class="banner-right">
								<div class="Top-text"><b>Summary</b></div>
								<div class="small-grid">
									<div class="green"><b> {subject != 'mock' ? "Correct" : 'Biology'}</b><h7>{subject == 'mock' ? <>{bioCorrectCout}/68</> : correctMcq?.length}</h7></div>
									<div class="orange"><b>{subject != 'mock' ? "Unattempted" : 'Chemistry'} </b><h7>{subject == 'mock' ? <>{chemCorrectCout}/54</> : (mcqs.length - (correctMcq?.length + wrongMcq?.length))}</h7></div>
									<div class="red"><b>{subject != 'mock' ? "Wrong" : 'Physics'}</b><h7>{subject == 'mock' ? <>{bioCorrectCout}/54</> : wrongMcq?.length}</h7></div>
									<div class="blue"><b>{subject != 'mock' ? "Percentage" : 'English'}</b><h7>{subject == 'mock' ? <>{engCorrectCount}/18</> : <>{((correctMcq?.length / mcqs.length) * 100).toFixed(1)} %</>}</h7></div>
									{subject == 'mock' && <div class="pink"><b>Logical Reasoning</b><h7>{logicCorrectCount}/6</h7></div>}
								</div>
								<div class="button">
									<button className='mt-4' onClick={() => setShowResultModel(true)}>Review</button>
									<button className='mt-2 ' onClick={() => navigate(-2)}>Continue</button>
								</div>
							</div>
						</div>
					</Modal.Body>
				</Modal>

				{/* //preview of mcqs */}
				<Modal show={showResultModel} fullscreen={true} className='ps-0 p-0 Result-Model-box' dialogClassName="modal-100w">
					<Modal.Body className='mcq-model-body bg-danger p-0'>
						<div className="container mcq-review-model">
							<div className="row p-2">
								<span className='w-auto m-auto bg-danger p-2 px-3 text-light fs-5 rounded-5 hover-btn-custom' onClick={() => setShowResultModel(false)}>X</span>
								<h3 className='text-center mt-4 fw-bold'>Review Your Attempted MCQs</h3>
							</div>
							{
								subject !== 'mock' ? <>

									<div className="accordion accordion-flush" id="accordionFlushExample">
										<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
											<h2 className="accordion-header rounded" id="flush-headingLast">
												<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last" aria-expanded="false" aria-controls="last">
													Review MCQs
												</button>
											</h2>
											<div id="last" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
												<div className="accordion-body p-0">
													<ul className='p-4'>
														{
															mcqs.map((ele, i) => (
																<>
																	<div className='mt-1' key={i}>
																		<li style={{ listStyle: 'none' }}>
																			<div className="row py-1">
																				<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																			</div>
																			{
																				ele.options.map((inEle, inI) => (
																					<div className="d-flex gap-2">
																						<div
																							style={{
																								background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																									? '#1CC88A'
																									: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																										? 'red'
																										: 'none',
																								color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																									(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																									? 'white'
																									: 'inherit',
																								borderRadius: '50%',
																								padding: '1px',
																								height: 'fit-content'
																							}}
																						>
																							({alphabets[inI]})
																						</div>
																						<div>
																							<MathJax inline>{inEle}</MathJax>
																						</div>
																					</div>
																				))
																			}
																			<div className="row mt-2">
																				<div className="col-6 ">
																					{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																					{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																					{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																						&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																				</div>
																				<div className="col-6 pt-1">
																					{
																						(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																					}
																				</div>
																			</div>

																			<div className="row pt-3">
																				<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																					Explainantion:
																				</div>
																				<div>
																					<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																				</div>

																			</div>
																		</li>
																		<hr className='bg-secondary' style={{ height: '2px' }} />
																	</div>
																</>
															))
														}
													</ul>
												</div>
											</div>
										</div>
									</div>

								</>
									:
									<>
										<div className="accordion accordion-flush" id="accordionFlushExample">
											<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
												<h2 className="accordion-header rounded" id="flush-headingLast">
													<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last" aria-expanded="false" aria-controls="last">
														Biology
													</button>
												</h2>
												<div id="last" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
													<div className="accordion-body p-0">
														<ul className='p-4'>
															{
																mcqs.map((ele, i) => (
																	<>
																		{ele.subject == 'biology' &&
																			<div className='mt-1' key={i}>
																				<li style={{ listStyle: 'none' }}>
																					<div className="row py-1">
																						<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																					</div>
																					{
																						ele.options.map((inEle, inI) => (
																							<div className="d-flex gap-2">
																								<div
																									style={{
																										background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																											? '#1CC88A'
																											: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																												? 'red'
																												: 'none',
																										color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																											(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																											? 'white'
																											: 'inherit',
																										borderRadius: '50%',
																										padding: '1px',
																										height: 'fit-content'
																									}}
																								>
																									({alphabets[inI]})
																								</div>
																								<div>
																									<MathJax inline>{inEle}</MathJax>
																								</div>
																							</div>
																						))
																					}
																					<div className="row mt-2">
																						<div className="col-6 ">
																							{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																							{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																							{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																								&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																						</div>
																						<div className="col-6 pt-1">
																							{
																								(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																							}
																						</div>
																					</div>

																					<div className="row pt-3">
																						<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																							Explainantion:
																						</div>
																						<div>
																							<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																						</div>

																					</div>
																				</li>
																				<hr className='bg-secondary' style={{ height: '2px' }} />
																			</div>
																		}
																	</>
																))
															}
														</ul>
													</div>
												</div>
											</div>
										</div>
										{/* //Chemistry */}
										<div className="accordion accordion-flush mt-3" id="accordionFlushExample2">
											<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
												<h2 className="accordion-header rounded" id="flush-headingLast">
													<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last2" aria-expanded="false" aria-controls="last">
														Chemistry
													</button>
												</h2>
												<div id="last2" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
													<div className="accordion-body p-0">
														<ul className='p-4'>
															{
																mcqs.map((ele, i) => (
																	<>
																		{ele.subject == 'chemistry' &&
																			<div className='mt-1' key={i}>
																				<li style={{ listStyle: 'none' }}>
																					<div className="row py-1">
																						<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																					</div>
																					{
																						ele.options.map((inEle, inI) => (
																							<div className="d-flex gap-2">
																								<div
																									style={{
																										background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																											? '#1CC88A'
																											: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																												? 'red'
																												: 'none',
																										color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																											(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																											? 'white'
																											: 'inherit',
																										borderRadius: '50%',
																										padding: '1px',
																										height: 'fit-content'
																									}}
																								>
																									({alphabets[inI]})
																								</div>
																								<div>
																									<MathJax inline>{inEle}</MathJax>
																								</div>
																							</div>
																						))
																					}
																					<div className="row mt-2">
																						<div className="col-6 ">
																							{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																							{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																							{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																								&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																						</div>
																						<div className="col-6 pt-1">
																							{
																								(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																							}
																						</div>
																					</div>

																					<div className="row pt-3">
																						<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																							Explainantion:
																						</div>
																						<div>
																							<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																						</div>

																					</div>
																				</li>
																				<hr className='bg-secondary' style={{ height: '2px' }} />
																			</div>
																		}
																	</>
																))
															}
														</ul>

													</div>
												</div>
											</div>
										</div>
										{/* //Physics */}
										<div className="accordion accordion-flush mt-3" id="accordionFlushExample3">
											<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
												<h2 className="accordion-header rounded" id="flush-headingLast">
													<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last3" aria-expanded="false" aria-controls="last">
														Physics
													</button>
												</h2>
												<div id="last3" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
													<div className="accordion-body p-0">
														<ul className='p-4'>
															{
																mcqs.map((ele, i) => (
																	<>
																		{ele.subject == 'physics' &&
																			<div className='mt-1' key={i}>
																				<li style={{ listStyle: 'none' }}>
																					<div className="row py-1">
																						<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																					</div>
																					{
																						ele.options.map((inEle, inI) => (
																							<div className="d-flex gap-2">
																								<div
																									style={{
																										background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																											? '#1CC88A'
																											: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																												? 'red'
																												: 'none',
																										color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																											(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																											? 'white'
																											: 'inherit',
																										borderRadius: '50%',
																										padding: '1px',
																										height: 'fit-content'
																									}}
																								>
																									({alphabets[inI]})
																								</div>
																								<div>
																									<MathJax inline>{inEle}</MathJax>
																								</div>
																							</div>
																						))
																					}
																					<div className="row mt-2">
																						<div className="col-6 ">
																							{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																							{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																							{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																								&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																						</div>
																						<div className="col-6 pt-1">
																							{
																								(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																							}
																						</div>
																					</div>

																					<div className="row pt-3">
																						<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																							Explainantion:
																						</div>
																						<div>
																							<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																						</div>

																					</div>
																				</li>
																				<hr className='bg-secondary' style={{ height: '2px' }} />
																			</div>
																		}
																	</>
																))
															}
														</ul>

													</div>
												</div>
											</div>
										</div>
										{/* //English */}
										<div className="accordion accordion-flush mt-3" id="accordionFlushExample3">
											<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
												<h2 className="accordion-header rounded" id="flush-headingLast">
													<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last4" aria-expanded="false" aria-controls="last">
														English
													</button>
												</h2>
												<div id="last4" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
													<div className="accordion-body">
														<ul className='p-4'>
															{
																mcqs.map((ele, i) => (
																	<>
																		{ele.subject == 'english' &&
																			<div className='mt-1' key={i}>
																				<li style={{ listStyle: 'none' }}>
																					<div className="row py-1">
																						<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																					</div>
																					{
																						ele.options.map((inEle, inI) => (
																							<div className="d-flex gap-2">
																								<div
																									style={{
																										background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																											? '#1CC88A'
																											: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																												? 'red'
																												: 'none',
																										color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																											(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																											? 'white'
																											: 'inherit',
																										borderRadius: '50%',
																										padding: '1px',
																										height: 'fit-content'
																									}}
																								>
																									({alphabets[inI]})
																								</div>
																								<div>
																									<MathJax inline>{inEle}</MathJax>
																								</div>
																							</div>
																						))
																					}
																					<div className="row mt-2">
																						<div className="col-6 ">
																							{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																							{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																							{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																								&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																						</div>
																						<div className="col-6 pt-1">
																							{
																								(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																							}
																						</div>
																					</div>

																					<div className="row pt-3">
																						<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																							Explainantion:
																						</div>
																						<div>
																							<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																						</div>

																					</div>
																				</li>
																				<hr className='bg-secondary' style={{ height: '2px' }} />
																			</div>
																		}
																	</>
																))
															}
														</ul>
													</div>
												</div>
											</div>
										</div>
										{/* //Logic */}
										<div className="accordion accordion-flush mt-3" id="accordionFlushExample5">
											<div className="accordion-item mt-2 shadow" style={{ borderRadius: '12px' }} initial="hidden">
												<h2 className="accordion-header rounded" id="flush-headingLast">
													<button className="accordion-button collapsed rounded fw-bold fs-5 text-secondary" style={{ background: '#eddfff91' }} type="button" data-bs-toggle="collapse" data-bs-target="#last5" aria-expanded="false" aria-controls="last5">
														Logical
													</button>
												</h2>
												<div id="last5" className="accordion-collapse collapse rounded" aria-labelledby="flush-headingLast" data-bs-parent="#accordionFlushExample">
													<div className="accordion-body">
														<ul className='p-4'>
															{
																mcqs.map((ele, i) => (
																	<>
																		{ele.subject == 'logic' &&
																			<div className='mt-1' key={i}>
																				<li style={{ listStyle: 'none' }}>
																					<div className="row py-1">
																						<b>Q:{i + 1}) &nbsp; <MathJax inline>{ele.question}</MathJax></b>
																					</div>
																					{
																						ele.options.map((inEle, inI) => (
																							<div className="d-flex gap-2">
																								<div
																									style={{
																										background: correctMcq.includes(ele._id) && inI + 1 === ele.selected
																											? '#1CC88A'
																											: wrongMcq.includes(ele._id) && inI + 1 === ele.selected
																												? 'red'
																												: 'none',
																										color: (correctMcq.includes(ele._id) && inI + 1 === ele.selected) ||
																											(wrongMcq.includes(ele._id) && inI + 1 === ele.selected)
																											? 'white'
																											: 'inherit',
																										borderRadius: '50%',
																										padding: '1px',
																										height: 'fit-content'
																									}}
																								>
																									({alphabets[inI]})
																								</div>
																								<div>
																									<MathJax inline>{inEle}</MathJax>
																								</div>
																							</div>
																						))
																					}
																					<div className="row mt-2">
																						<div className="col-6 ">
																							{(correctMcq.includes(ele._id) == true) && <div className="bg-success text-white p-1 rounded shadow-sm rounded-2">Correct</div>}
																							{(wrongMcq.includes(ele._id) == true) && <div className="bg-danger text-white p-1 rounded shadow-sm rounded-2">Wrong</div>}
																							{(wrongMcq.includes(ele._id) == false && correctMcq.includes(ele._id) == false)
																								&& <div className="bg-info text-white p-1 rounded shadow-sm rounded-2">Not Attempted</div>}
																						</div>
																						<div className="col-6 pt-1">
																							{
																								(!correctMcq.includes(ele._id) == true) && <span>Correct option: {ele.correctOption}</span>
																							}
																						</div>
																					</div>

																					<div className="row pt-3">
																						<div className='fw-bold' style={{ color: '#625b5bc4' }}>
																							Explainantion:
																						</div>
																						<div>
																							<MathJax style={{ whiteSpace: 'pre-line' }} inline>{ele.explain}</MathJax>
																						</div>

																					</div>
																				</li>
																				<hr className='bg-secondary' style={{ height: '2px' }} />
																			</div>
																		}
																	</>
																))
															}
														</ul>
													</div>
												</div>
											</div>
										</div>

									</>
							}
						</div>
					</Modal.Body>
				</Modal>

			</div>
		</MathJaxContext>
	)
}

export default Mcqs