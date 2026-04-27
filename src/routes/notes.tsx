import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Note = {
    id: string
    content: string
    userId: string
    createdAt: string
}

export const Route = createFileRoute("/notes")({ component: NotesPage })

function NotesPage() {
    const { data: session, isPending } = authClient.useSession()
    const navigate = useNavigate()

    const [notes, setNotes] = useState<Note[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [content, setContent] = useState("")
    const [saving, setSaving] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<Note | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!isPending && !session) navigate({ to: "/auth/$path", params: { path: "sign-in" } })
    }, [session, isPending, navigate])

    const loadNotes = useCallback(async () => {
        setListLoading(true)
        try {
            const res = await fetch("/api/notes")
            if (res.ok) setNotes(await res.json())
        } finally {
            setListLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session) loadNotes()
    }, [session, loadNotes])

    async function addNote(e: React.FormEvent) {
        e.preventDefault()
        if (!content.trim()) return
        setSaving(true)
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            })
            if (res.ok) {
                setContent("")
                await loadNotes()
            }
        } finally {
            setSaving(false)
        }
    }

    async function deleteNote(note: Note) {
        setDeleting(true)
        try {
            await fetch(`/api/notes?id=${note.id}`, { method: "DELETE" })
            setNotes((prev) => prev.filter((n) => n.id !== note.id))
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    if (isPending) {
        return (
            <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
                <span className="text-sm text-muted-foreground">Loading…</span>
            </main>
        )
    }

    if (!session) return null

    return (
        <AppLayout>
            <main className="mx-auto max-w-2xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Notes</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {listLoading ? "Loading…" : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                <form onSubmit={addNote} className="mb-6">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        rows={4}
                        className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault()
                                addNote(e as unknown as React.FormEvent)
                            }
                        }}
                    />
                    <div className="mt-2 flex justify-end">
                        <Button type="submit" disabled={saving || !content.trim()}>
                            {saving ? "Saving…" : "Add Note"}
                        </Button>
                    </div>
                </form>

                {listLoading ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
                ) : notes.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        No notes yet. Write one above.
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {notes.map((note) => (
                            <li key={note.id} className="rounded-xl border bg-card px-4 py-3">
                                <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(note.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => setPendingDelete(note)}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {pendingDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <button
                            type="button"
                            aria-label="Close"
                            className="absolute inset-0 bg-black/40"
                            onClick={() => !deleting && setPendingDelete(null)}
                        />
                        <div className="relative w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
                            <h2 className="text-base font-semibold">Delete note?</h2>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                "{pendingDelete.content}"
                            </p>
                            <div className="mt-5 flex justify-end gap-2">
                                <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={deleting}
                                    onClick={() => deleteNote(pendingDelete)}
                                >
                                    {deleting ? "Deleting…" : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AppLayout>
    )
}

function TrashIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
    )
}
