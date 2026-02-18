    // components/Navbar.tsx
    'use client'

    import { useState } from 'react'
    import { usePathname, useRouter } from 'next/navigation'
    import Link from 'next/link'
    import { IconButton } from '@mui/material'
    import { Close } from '@mui/icons-material'
    import { closeSnackbar, useSnackbar } from 'notistack'
    import Axios from '@/lib/Axios'
    import Image from 'next/image'
    import { Menu, X } from 'lucide-react'

    const Navbar = () => {
    const router = useRouter()
    const pathname = usePathname()
    const { enqueueSnackbar } = useSnackbar()
    const [menuOpen, setMenuOpen] = useState(false)

    const showCenteredSnackbar = (message, variant) => {
        enqueueSnackbar(message, {
        variant,
        autoHideDuration: 3000,
        anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
        },
        action: (
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => closeSnackbar()}>
            <Close fontSize="small" />
            </IconButton>
        ),
        })
    }

    const handleMdcat = async () => {
        try {
        const res = await Axios.get('/userinfo')
        const user = res?.data?.user
        if (user?.isMdcat) router.push('/dashboard/subject/mdcat')
        else {
            showCenteredSnackbar('Checkout course to proceed further!', 'info')
            router.push('/checkout?course=mdcat')
        }
        } catch (err) {
        console.log(err)
        router.push('/dashboard')
        }
    }

    const handleNums = async () => {
        try {
        const res = await Axios.get('/userinfo')
        const user = res?.data?.user
        if (user?.isNums) router.push('/dashboard/subject/nums')
        else {
            showCenteredSnackbar('Checkout course to proceed further!', 'info')
            router.push('/checkout?course=nums')
        }
        } catch (err) {
        console.log(err)
        router.push('/dashboard')
        }
    }

    return (
        <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={100} height={45} />
            </Link>

            <div className="hidden md:flex space-x-6 items-center">
                
                <button onClick={handleNums} className="hover:text-blue-600">NUMS MCQs</button>
                <button onClick={handleMdcat} className="hover:text-blue-600">MDCAT MCQs</button>
                <div className="relative group">
                <button className="hover:text-blue-600">Courses</button>
                <div className="absolute hidden group-hover:block bg-white shadow-md rounded-md mt-2 w-40">
                    <Link href="/checkout?course=mdcat" className="block px-4 py-2 hover:bg-gray-100">MDCAT</Link>
                    <Link href="/checkout?course=nums" className="block px-4 py-2 hover:bg-gray-100">NUMS</Link>
                    <Link href="/checkout?course=mdcat%2Bnums" className="block px-4 py-2 hover:bg-gray-100">MDCAT + NUMS</Link>
                </div>
                </div>
                <div className="relative group">
                <button className="hover:text-blue-600">Dashboard</button>
                <div className="absolute hidden group-hover:block bg-white shadow-md rounded-md mt-2 w-40">
                    <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100">My Courses</Link>
                    <Link href="/dashboard/stats" className="block px-4 py-2 hover:bg-gray-100">Statistics</Link>
                    <Link href="/dashboard/profile" className="block px-4 py-2 hover:bg-gray-100">My Account</Link>
                </div>
                </div>
                <div className="flex items-center space-x-3">
                <a href="whatsapp://send?abid=03479598144&text=Hello%2C%20World!">
                    <Image src="/whatsapp.svg" alt="whatsapp" width={28} height={28} />
                </a>
                <a href="tel:0347-9598144">
                    <Image src="/phone.svg" alt="phone" width={25} height={25} />
                </a>
                <span className="text-sm font-semibold text-blue-700">0347-9598144</span>
                </div>
            </div>

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
            <div className="md:hidden bg-white shadow-lg py-4 px-4 space-y-4">
            <Link href="/" className="block">Home</Link>
            <Link href="/calculator" className="block">Aggregate Calculator</Link>
            <button onClick={handleNums} className="block">NUMS MCQs</button>
            <button onClick={handleMdcat} className="block">MDCAT MCQs</button>
            <div className="border-t pt-2">
                <p className="font-semibold">Courses</p>
                <Link href="/checkout?course=mdcat" className="block">MDCAT</Link>
                <Link href="/checkout?course=nums" className="block">NUMS</Link>
                <Link href="/checkout?course=mdcat%2Bnums" className="block">MDCAT + NUMS</Link>
            </div>
            <div className="border-t pt-2">
                <p className="font-semibold">Dashboard</p>
                <Link href="/dashboard" className="block">My Courses</Link>
                <Link href="/dashboard/stats" className="block">Statistics</Link>
                <Link href="/dashboard/profile" className="block">My Account</Link>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
                <a href="whatsapp://send?abid=03479598144&text=Hello%2C%20World!">
                <Image src="/whatsapp.svg" alt="whatsapp" width={28} height={28} />
                </a>
                <a href="tel:0347-9598144">
                <Image src="/phone.svg" alt="phone" width={25} height={25} />
                </a>
                <span className="text-sm font-semibold text-blue-700">0347-9598144</span>
            </div>
            </div>
        )}
        </nav>
    )
    }

    export default Navbar