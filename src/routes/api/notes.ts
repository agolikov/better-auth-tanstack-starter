import { and, desc, eq } from "drizzle-orm"
import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { notes } from "@/database/schema"
import { auth } from "@/lib/auth"

export const Route = createFileRoute("/api/notes")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

                const rows = await db
                    .select()
                    .from(notes)
                    .where(eq(notes.userId, session.user.id))
                    .orderBy(desc(notes.createdAt))

                return Response.json(rows)
            },

            POST: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

                const { content } = await request.json()
                if (!content?.trim()) {
                    return Response.json({ error: "content is required" }, { status: 400 })
                }

                const [row] = await db
                    .insert(notes)
                    .values({
                        id: crypto.randomUUID(),
                        content: content.trim(),
                        userId: session.user.id,
                        createdAt: new Date()
                    })
                    .returning()

                return Response.json(row, { status: 201 })
            },

            DELETE: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

                const id = new URL(request.url).searchParams.get("id")
                if (!id) return Response.json({ error: "id is required" }, { status: 400 })

                const deleted = await db
                    .delete(notes)
                    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
                    .returning()

                if (!deleted.length) return Response.json({ error: "Not found" }, { status: 404 })

                return new Response(null, { status: 204 })
            }
        }
    }
})
