"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
	Button,
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Alert,
	Snackbar,
	Dialog,
	DialogTitle,
	DialogContent,
	Chip,
	Divider,
} from "@mui/material"
import { ArrowLeftIcon, ArrowUpLeftFromSquare, CheckCircle2Icon, CheckCircleIcon, CreditCardIcon, ShoppingCartIcon, TagIcon } from "lucide-react"

import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr"
import jazzCash from "/public/assets/jazzcash.png"
import easyPaisa from "/public/assets/easypaisa.png"
import bank from "/public/assets/bank.png"
import mdImg from "/public/courses/1.png"
import numsImg from "/public/courses/2.png"
import mdNumsImg from "/public/courses/3.png"
import Axios from "@/lib/Axios"
import { uploadFile } from "@/actions/Cloudniary"
import ImageUploaderBox from "@/components/upload/Uplader"
import { useSession } from "next-auth/react"

// Mock data - replace with your actual data
const courseImages = {
	mdcat: mdImg,
	nums: numsImg,
	"mdcat+nums": mdNumsImg,
}

const paymentLogos = {
	jazzcash: jazzCash,
	easypaisa: easyPaisa,
	bank: bank,
}

const accounts = {
	jazzcash: {
		name: "Muhammad Taimoor Hafeez",
		ac: "03479598144",
		iban: "PK47JCMA2605923479598144",
	},
	easypaisa: {
		name: "Muhammad Taimoor Hafeez",
		ac: "03479598144",
		iban: "PK38TMFB0000000058917550",
	},
	bank: {
		name: "Muhammad Taimoor Hafeez",
		ac: "22010109673135",
		iban: "PK03MEZN0022010109673135",
	},
}

interface CourseData {
	cprice: number
	cdesc: string
	features: string[]
	cdiscount: number
}



export default function Checkout({ isSeries, seriesData = {} }) {
	const [activeTab, setActiveTab] = useState(1)
	const [payMethod, setPayMethod] = useState("jazzcash")
	const [imageUrl, setImageUrl] = useState(null)
	const [showAlert, setShowAlert] = useState(false)
	const [loading, setLoading] = useState(false)
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "info" as "success" | "error" | "warning" | "info",
	})
	const [cData, setCData] = useState<CourseData>({
		cprice: null,
		cdesc:
			"",
		features: [],
		cdiscount: 0,
	})
	const [promoPrice, setPromoPrice] = useState(0)
	const [promoCode, setPromoCode] = useState("")
	const { data: session, status } = useSession();

	const router = useRouter()
	const searchParams = useSearchParams()
	const course = searchParams.get("course") || "mdcat"
	const ref = useRef<HTMLInputElement>(null)


	const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
		setSnackbar({ open: true, message, severity })
	}

	const handleRedeem = async () => {
		const promoCodeValue = ref.current?.value || ""
		setPromoCode(promoCodeValue)

		try {
			if (!promoCodeValue) {
				setPromoPrice(0)
				throw new Error("Please provide a promo code")
			}

			const res = await Axios.get(`/api/v1/referral/${promoCodeValue}`);

			if (res.status === 200 && res.data.statusCode == 404) {
				showSnackbar(res.data.status, "error");
				setPromoPrice(0)
				setPromoCode('');

			} else if (res.status === 200 && res.data.statusCode == 401) {
				showSnackbar(res.data.status, "warning");
				setPromoPrice(0)
				setPromoCode('');
			}
			else {
				showSnackbar("Applied Successfully", "success");
				const percentage = parseInt(res.data.priceDiscount); //10
				const discountedPrice = cData.cdiscount > 0
					? Math.round(cData.cprice - (cData.cprice * cData.cdiscount) / 100)
					: cData.cprice;
				const totalPrice = (discountedPrice * percentage / 100);
				setPromoPrice(totalPrice)
			}
		} catch (error) {
			showSnackbar((error as Error).message, "error")
			setPromoCode("")
		}
	}


	useEffect(() => {
		const fetch = async () => {
			let res;
			if (isSeries) {
				setCData({
					cprice: seriesData.price || 0,
					cdesc: seriesData.description || "",
					features: [],
				})
				return;
			}

			isSeries = false; // Ensure isSeries is false for course checkout

			if (course == 'mdcat') {
				res = await Axios.get('/api/v1/course/mdcat');
			}
			else if (course == 'nums') {
				res = await Axios.get('/api/v1/course/nums');
			}
			else {
				const encodedCourse = encodeURIComponent("mdcat+nums"); // Safely encode any special chars
				res = await Axios.get(`/api/v1/course/${encodedCourse}`);
			}
			setCData({ ...res.data, cdiscount: res.data.cdiscount ?? 0 });
		}
		fetch();
	}, [promoPrice, course]);


	const handleImageChange = (url) => {
		if (url) {
			setImageUrl(url)
		}
	}

	const handlePurchase = async () => {
		if (status == "unauthenticated") {
			showSnackbar("Please sign in to purchase course", "warning");
			return;
		}

		setLoading(true)
		if (!imageUrl) {
			showSnackbar("Please upload payment screenshot to proceed", "warning")
			setLoading(false)
			return
		}

		if (isSeries) {
			try {
				const res = await Axios.post('/api/v1/payment/purchase-series', {
					seriesId: seriesData._id,
					providerRef: imageUrl,
					couponCode: promoCode,
					discountApplied: promoPrice
				})
				if (res)
					showSnackbar("Order placed successfully! We'll verify your payment shortly.", "success")
				setShowAlert(true)
				setLoading(false)
			} catch (error) {
				console.log(error)
			}
			return
		}

		try {
			// Mock API call - replace with actual implementation
			const discountedPrice = cData.cdiscount > 0
				? Math.round(cData.cprice - (cData.cprice * cData.cdiscount) / 100)
				: cData.cprice;
			const finalPrice = discountedPrice - promoPrice;
			const res = await Axios.post('/api/v1/purchase/course', {
				finalPrice: finalPrice,
				course,
				refCode: promoCode,
				fileURL: imageUrl
			})
			if (res)
				showSnackbar("Order placed successfully! We'll verify your payment shortly.", "success")
			setShowAlert(true)
			setLoading(false)
		} catch (error) {
			showSnackbar("Failed to process order. Please try again.", "error")
			setLoading(false)
		}
	}

	const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
		<div hidden={value !== index} className="w-full">
			{value === index && children}
		</div>
	)

	return (
		<div className="min-h-screen bg-surface">
			{/* Header */}
			<div className="bg-white border-b border-line">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold  bg-gradient-to-r from-primary  to-purple text-transparent bg-clip-text">
								{isSeries ? seriesData.title : course.toUpperCase()} MCQ Bank
							</h1>
							<p className="text-secondary-700 mt-1">Secure Checkout Process</p>
						</div>
						<Chip
							icon={<ShoppingCartIcon className="w-4 h-4" />}
							label="1 Item"
							className="bg-[#1F305E] text-white"
						/>
					</div>
				</div>

			</div>

			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">

					{/* Main Content */}
					<div className="grid lg:grid-cols-12 gap-8">
						{/* Main Content Area */}
						<div className="lg:col-span-8">
							<div className="bg-white rounded-2xl shadow-card border border-line overflow-hidden">
								{/* Payment */}
								{(
									<div className="p-8">
										<div className="flex items-center space-x-3 mb-6">
											<CreditCardIcon className="w-6 h-6 text-primary" />
											<h2 className="text-2xl font-bold text-black">Payment Method</h2>
										</div>

										<div className="grid lg:grid-cols-2 gap-8">
											{/* Payment Methods */}
											<div>
												<FormControl component="fieldset" className="w-full">
													<FormLabel component="legend" className="text-lg font-semibold text-black mb-4">
														Choose Payment Option
													</FormLabel>
													<RadioGroup
														value={payMethod}
														onChange={(e) => setPayMethod(e.target.value)}
														className="space-y-3"
													>
														{Object.entries(accounts).map(([method, _]) => (
															<div
																key={method}
																className={`border-2 rounded-xl p-4 transition-all ${payMethod === method ? "border-primary bg-primary/5" : "border-line bg-white hover:border-primary/30"}`}
															>
																<FormControlLabel
																	value={method}
																	control={<Radio sx={{ color: "#1757ab", "&.Mui-checked": { color: "#1757ab" } }} />}
																	label={
																		<div className="flex items-center justify-between w-full">
																			<span className="font-medium text-black">
																				{method === "jazzcash"
																					? "JazzCash"
																					: method === "easypaisa"
																						? "EasyPaisa"
																						: "Bank Transfer"}
																			</span>
																			<Image
																				src={paymentLogos[method as keyof typeof paymentLogos] || "/placeholder.svg"}
																				alt={method}
																				width={120}
																				height={40}
																				className="h-8 w-auto ms-2"
																			/>
																		</div>
																	}
																	className="w-full m-0"
																/>
															</div>
														))}
													</RadioGroup>
												</FormControl>
											</div>

											{/* Payment Details */}
											<div>
												<div className="bg-surface rounded-xl p-6 mb-6">
													<div className="flex items-center space-x-3 mb-4">
														<Image
															src={paymentLogos[payMethod as keyof typeof paymentLogos] || "/placeholder.svg"}
															alt={payMethod}
															width={120}
															height={40}
															className="h-8 w-auto"
														/>
														<span className="text-sm text-secondary">Selected Payment Method</span>
													</div>

													<div className="space-y-3 text-sm">
														<div className="flex justify-between">
															<span className="text-secondary">Account Title:</span>
															<span className="font-medium text-black">
																{accounts[payMethod as keyof typeof accounts]?.name}
															</span>
														</div>
														<div className="flex justify-between">
															<span className="text-secondary">Account No:</span>
															<span className="font-mono font-medium text-black">
																{accounts[payMethod as keyof typeof accounts]?.ac}
															</span>
														</div>
														<div className="flex justify-between">
															<span className="text-secondary">IBAN:</span>
															<span className="font-mono font-medium text-black">
																{accounts[payMethod as keyof typeof accounts]?.iban}
															</span>
														</div>
													</div>
												</div>

												{/* Screenshot Upload */}
												<div className="rounded-xl p-1 flex justify-center text-center">
													<ImageUploaderBox onUpload={handleImageChange} />
												</div>
											</div>
										</div>

										<Divider className="my-8 pb-4" />

										{/* Action Buttons */}
										<div className="flex flex-col mt-4 sm:flex-row gap-4 justify-end">
											<Button
												variant="contained"
												size="large"
												className="px-8 py-3 bg-success hover:bg-success/90 text-white font-semibold"
												onClick={handlePurchase}
												disabled={loading || !imageUrl}
												startIcon={loading ? null : <CurrencyDollarIcon className="w-5 h-5" />}
											>
												{loading ? "Processing Order..." : "Complete Purchase"}
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Order Summary Sidebar */}
						<div className="lg:col-span-4">
							<div className="bg-white rounded-2xl shadow-card border border-line p-6 sticky top-4">
								<div className="flex items-center space-x-3 mb-6">
									<ShoppingCartIcon className="w-6 h-6 text-primary" />
									<h3 className="text-xl font-bold text-black">Order Summary</h3>
								</div>

								<div className="space-y-4 mb-6">
									<div className="flex justify-between items-start">
										<div>
											<p className="font-semibold text-black">{isSeries ? seriesData.title : course.toUpperCase()} MCQ Bank</p>
											<p className="text-sm text-secondary">Digital Course Access</p>
										</div>
										<div className="text-right">
											<span className="font-bold text-black">
												PKR {cData?.cdiscount > 0
													? Math.round(cData.cprice - (cData.cprice * cData.cdiscount) / 100).toLocaleString()
													: cData?.cprice?.toLocaleString()}
											</span>
											{cData?.cdiscount > 0 && (
												<span className="block text-sm text-gray-400 line-through">
													PKR {cData?.cprice?.toLocaleString()}
												</span>
											)}
										</div>
									</div>

									{cData?.cdiscount > 0 && (
										<div className="flex justify-between items-center text-red-500">
											<div className="flex items-center space-x-2">
												<TagIcon className="w-4 h-4" />
												<span className="font-medium">Course Discount</span>
											</div>
											<span className="font-bold">-{cData.cdiscount}%</span>
										</div>
									)}

									{promoPrice > 0 && (
										<div className="flex justify-between items-center text-success">
											<div className="flex items-center space-x-2">
												<TagIcon className="w-4 h-4" />
												<span className="font-medium">Promo Discount</span>
											</div>
											<span className="font-bold">-PKR {promoPrice?.toLocaleString()}</span>
										</div>
									)}

									<Divider />

									<div className="flex justify-between items-center">
										<span className="text-lg font-bold text-black">Total Amount</span>
										<span className="text-2xl font-bold text-primary">
											PKR {(() => {
												const discountedPrice = cData?.cdiscount > 0
													? Math.round(cData.cprice - (cData.cprice * cData.cdiscount) / 100)
													: cData.cprice;
												return (discountedPrice - promoPrice)?.toLocaleString();
											})()}
										</span>
									</div>
								</div>

								{/* Promo Code Section */}
								<div className="bg-surface rounded-xl p-4 mb-6">
									<div className="flex items-center space-x-2 mb-3">
										<TagIcon className="w-5 h-5 text-primary" />
										<span className="font-medium text-black">Have a promo code?</span>
									</div>
									<div className="space-y-3">
										<input
											ref={ref}
											type="text"
											placeholder="Enter referral code"
											className="w-full px-4 py-3 border border-line rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
										/>
										<Button
											variant="outlined"
											fullWidth
											onClick={handleRedeem}
											className="border-primary text-primary hover:bg-primary hover:text-white py-2"
										>
											Apply Code
										</Button>
									</div>
								</div>

								{/* Security Badge */}
								<div className="bg-green/10 border border-green/20 rounded-lg p-4 text-center">
									<CheckCircleIcon className="w-8 h-8 text-success mx-auto mb-2" />
									<p className="text-sm font-medium text-black">Secure Payment</p>
									<p className="text-xs text-secondary">Your payment information is protected</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Success Dialog */}
			<Dialog
				open={showAlert}
				onClose={() => setShowAlert(false)}
				PaperProps={{
					className: "rounded-2xl p-4",
				}}
			>
				<DialogTitle className="text-center pb-2">
					<CheckCircle2Icon className="w-16 h-16 text-success mx-auto mb-4" />
					<h3 className="text-2xl font-bold text-black">Order Placed Successfully!</h3>
				</DialogTitle>
				<DialogContent className="text-center pb-6">
					<p className="text-secondary mb-6">
						Thank you for your purchase. We've received your payment screenshot and will verify it within 24 hours.
					</p>
					<div className="space-y-3">
						<Button
							variant="contained"
							fullWidth
							className="bg-primary hover:bg-primary/90 text-white py-3"
							onClick={() => router.push("/dashboard/course-details")}
						>
							View Course Details
						</Button>
						<Button
							variant="outlined"
							fullWidth
							className="border-secondary2 text-secondary2 py-3"
							onClick={() => setShowAlert(false)}
						>
							Continue Shopping
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					severity={snackbar.severity}
					variant="filled"
					className="font-medium"
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</div>
	)
}
