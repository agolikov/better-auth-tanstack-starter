import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1">
            <aside className="sticky top-12 h-[calc(100vh-3rem)] w-52 shrink-0 overflow-y-auto border-r p-3 md:top-14 md:h-[calc(100vh-3.5rem)]">
                <p className="mb-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Library
                </p>
                <nav className="space-y-0.5">
                    <SidebarLink to="/" exact>
                        <PaperclipIcon />
                        Attachments
                    </SidebarLink>
                    <SidebarLink to="/notes">
                        <NoteIcon />
                        Notes
                    </SidebarLink>
                </nav>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    )
}

function SidebarLink({
    to,
    children,
    exact = false
}: {
    to: string
    children: React.ReactNode
    exact?: boolean
}) {
    const { location } = useRouterState()
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            {children}
        </Link>
    )
}

function PaperclipIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    )
}

function NoteIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    )
}
