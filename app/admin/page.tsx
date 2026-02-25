import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminQueue } from "@/components/admin-queue"
import { BottomNav } from "@/components/bottom-nav"
import { MaterialIcon } from "@/components/material-icon"

export const dynamic = "force-dynamic"

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

    if (!user) {
        redirect("/login")
    }

    if (!user.email || !ALLOWED_EMAILS.includes(user.email)) {
        return (
            <div className="min-h-screen bg-midnight flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mb-6">
                    <MaterialIcon name="block" className="text-5xl" />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Access Denied</h1>
                <p className="text-sm text-muted-foreground max-w-xs mb-8">
                    Your account ({user.email}) does not have administrative privileges.
                </p>
                <div className="flex gap-4">
                    <a href="/" className="px-6 py-3 glass rounded-xl text-xs font-black uppercase tracking-widest text-foreground">Go Home</a>
                    <a href="/login" className="px-6 py-3 bg-turbo-orange text-midnight rounded-xl text-xs font-black uppercase tracking-widest">Sign Out</a>
                </div>
            </div>
        )
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
