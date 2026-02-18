import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminQueue } from "@/components/admin-queue"
import { BottomNav } from "@/components/bottom-nav"

const ALLOWED_EMAILS = [
    "siliacay.javier@gmail.com",
    "javiersiliacaysiliacay1234@gmail.com",
    "javiersiliacay12@gmail.com"
]

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email || !ALLOWED_EMAILS.includes(user.email)) {
        redirect("/login")
    }

    return (
        <div className="min-h-screen pb-32">
            <header className="sticky top-0 z-50 glass border-b border-foreground/5">
                <div className="flex items-center justify-center px-5 h-16 max-w-lg mx-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em]">Control Center</span>
                        <span className="text-sm font-black text-foreground italic uppercase tracking-tight">Admin Dashboard</span>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-6">
                <AdminQueue />
            </main>

            <BottomNav />
        </div>
    )
}
