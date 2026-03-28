export default function TrackStockLogo() {
    return (
        <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 drop-shadow-sm"
        >
            <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
            <path
                d="M12 22C12 20.8954 12.8954 20 14 20H18V28C18 29.1046 17.1046 30 16 30H14C12.8954 30 12 29.1046 12 28V22Z"
                fill="white"
            />
            <path
                d="M22 16C22 14.8954 22.8954 14 24 14H26C27.1046 14 28 14.8954 28 16V28C28 29.1046 27.1046 30 26 30H24C22.8954 30 22 28V16Z"
                fill="white"
                fillOpacity="0.6"
            />
            <path
                d="M10 12C10 10.8954 10.8954 10 12 10H28C29.1046 10 30 10.8954 30 12V14C30 15.1046 29.1046 16 28 16H12C10.8954 16 10 15.1046 10 14V12Z"
                fill="white"
            />
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FB923C" />
                    <stop offset="1" stopColor="#EA580C" />
                </linearGradient>
            </defs>
        </svg>
    )
}

