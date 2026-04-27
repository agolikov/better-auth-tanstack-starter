import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type Attachment = {
    id: string
    name: string
    key: string
    size: number
    mimeType: string
    userId: string
    createdAt: string
}

export const Route = createFileRoute("/")({ component: IndexPage })

function IndexPage() {
    const { data: session, isPending } = authClient.useSession()
    const navigate = useNavigate()

    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState("")
    const [dragOver, setDragOver] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null)
    const [deleting, setDeleting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isPending && !session) navigate({ to: "/auth/$path", params: { path: "sign-in" } })
    }, [session, isPending, navigate])

    const loadAttachments = useCallback(async () => {
        setListLoading(true)
        try {
            const res = await fetch("/api/attachments")
            if (res.ok) setAttachments(await res.json())
        } finally {
            setListLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session) loadAttachments()
    }, [session, loadAttachments])

    async function uploadFile(file: File) {
        setUploading(true)
        setUploadError("")
        try {
            const key = `uploads/${session!.user.id}/${Date.now()}-${file.name}`
            const mimeType = file.type || "application/octet-stream"

            const urlRes = await fetch("/api/storage/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, contentType: mimeType })
            })
            if (!urlRes.ok) throw new Error("Could not get upload URL — check R2 configuration.")
            const { url } = await urlRes.json()

            const putRes = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": mimeType },
                body: file
            })
            if (!putRes.ok) throw new Error("Upload to storage failed.")

            const metaRes = await fetch("/api/attachments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: file.name, key, size: file.size, mimeType })
            })
            if (!metaRes.ok) throw new Error("Failed to save attachment record.")

            await loadAttachments()
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed.")
        } finally {
            setUploading(false)
        }
    }

    async function deleteAttachment(a: Attachment) {
        setDeleting(true)
        try {
            await fetch(`/api/attachments?id=${a.id}`, { method: "DELETE" })
            setAttachments((prev) => prev.filter((x) => x.id !== a.id))
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    async function downloadFile(key: string, name: string) {
        const res = await fetch(`/api/storage/download-url?key=${encodeURIComponent(key)}`)
        if (!res.ok) return
        const { url } = await res.json()
        const a = document.createElement("a")
        a.href = url
        a.download = name
        a.click()
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) uploadFile(file)
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
        e.target.value = ""
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
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Attachments</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {listLoading ? "Loading…" : `${attachments.length} attachment${attachments.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
                    {uploading ? <><Spinner />Uploading…</> : <><UploadIcon />Upload</>}
                </Button>
                <input ref={inputRef} type="file" className="hidden" onChange={handleInputChange} />
            </div>

            <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                    "mb-4 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-sm transition-colors select-none",
                    dragOver
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
            >
                <UploadIcon className="size-5" />
                <span>Drop a file here or <span className="text-primary underline underline-offset-4">browse</span></span>
            </button>

            {uploadError && (
                <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{uploadError}</p>
            )}

            {listLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
            ) : attachments.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No attachments yet. Upload one above.</div>
            ) : (
                <ul className="space-y-2">
                    {attachments.map((a) =>
                        a.mimeType.startsWith("image/") ? (
                            <li key={a.id} className="overflow-hidden rounded-xl border bg-card">
                                <ImagePreview storageKey={a.key} name={a.name} />
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{a.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatBytes(a.size)} · {fmtDate(a.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => downloadFile(a.key, a.name)}>
                                            <DownloadIcon />Download
                                        </Button>
                                        <Button variant="outline" size="icon-sm" onClick={() => setPendingDelete(a)}>
                                            <TrashIcon />
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ) : (
                            <li key={a.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                                <TypeBadge mimeType={a.mimeType} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{a.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatBytes(a.size)} · {fmtDate(a.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => downloadFile(a.key, a.name)}>
                                        <DownloadIcon />Download
                                    </Button>
                                    <Button variant="outline" size="icon-sm" onClick={() => setPendingDelete(a)}>
                                        <TrashIcon />
                                    </Button>
                                </div>
                            </li>
                        )
                    )}
                </ul>
            )}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => !deleting && setPendingDelete(null)} />
                    <div className="relative w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
                        <h2 className="text-base font-semibold">Delete attachment?</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{pendingDelete.name}</span> will be permanently
                            removed from storage. This cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={deleting}
                                onClick={() => deleteAttachment(pendingDelete)}
                            >
                                {deleting ? <><Spinner />Deleting…</> : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
        </AppLayout>
    )
}

function ImagePreview({ storageKey, name }: { storageKey: string; name: string }) {
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
        fetch(`/api/storage/download-url?key=${encodeURIComponent(storageKey)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data?.url && setSrc(data.url))
    }, [storageKey])

    if (!src) {
        return <div className="h-56 w-full animate-pulse bg-muted" />
    }

    return (
        <img
            src={src}
            alt={name}
            className="h-56 w-full object-cover"
        />
    )
}

function TypeBadge({ mimeType }: { mimeType: string }) {
    const base = "size-9 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wide"
    if (mimeType === "application/pdf")
        return <div className={cn(base, "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300")}>PDF</div>
    if (mimeType.startsWith("video/"))
        return <div className={cn(base, "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300")}>VID</div>
    if (mimeType.startsWith("audio/"))
        return <div className={cn(base, "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300")}>AUD</div>
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gzip"))
        return <div className={cn(base, "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300")}>ZIP</div>
    return <div className={cn(base, "bg-muted text-muted-foreground")}>FILE</div>
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

function UploadIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn("size-4", className)} aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    )
}

function DownloadIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )
}

function Spinner() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4 animate-spin" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
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
