import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin
    const redirectTo = requestUrl.searchParams.get('redirect_to')

    const ALLOWED_EMAILS = [
        "siliacay.javier@gmail.com",
        "javiersiliacaysiliacay1234@gmail.com",
        "javiersiliacay12@gmail.com"
    ]

    // Next.js Route Handlers need to handle cookies manually with NextResponse
    const response = NextResponse.redirect(`${origin}/profile`)

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const cookieHeader = request.headers.get('cookie') ?? ''
                        return cookieHeader.split(';').map(c => {
                            const [name, ...value] = c.trim().split('=')
                            return { name, value: value.join('=') }
                        })
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

        if (user?.email) {
            const isAdmin = ALLOWED_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase())

            // Re-configure response based on logic
            let target = redirectTo || (isAdmin ? '/admin' : '/profile')
            response.headers.set('Location', `${origin}${target}`)
        }
    }

    return response
}
