import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
    width: 32,
    height: 30,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FF5F00',
                    borderRadius: '8px',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {/* Car body - simplified to match reference */}
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H12c-.7 0-1.3.3-1.8.7C9.3 8.6 8 10 8 10s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
                    <path d="M5 17v2" />
                    <path d="M13 17v2" />
                    {/* Headlights */}
                    <circle cx="7" cy="14" r="1.5" fill="black" stroke="none" />
                    <circle cx="17" cy="14" r="1.5" fill="black" stroke="none" />
                    {/* Shine lines */}
                    <path d="M12 5v2" />
                    <path d="M9 6l1 2" />
                    <path d="M15 6l-1 2" />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    )
}
