import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { and, desc, eq } from "drizzle-orm"
import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { attachments } from "@/database/schema"
import { auth } from "@/lib/auth"
import { R2_BUCKET, r2 } from "@/lib/storage"

export const Route = createFileRoute("/api/attachments")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

                const rows = await db
                    .select()
                    .from(attachments)
                    .where(eq(attachments.userId, session.user.id))
                    .orderBy(desc(attachments.createdAt))

                return Response.json(rows)
            },

            POST: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

                const { name, key, size, mimeType } = await request.json()
                if (!name || !key || !size || !mimeType) {
                    return Response.json({ error: "name, key, size, mimeType are required" }, { status: 400 })
                }

                const [row] = await db
                    .insert(attachments)
                    .values({
                        id: crypto.randomUUID(),
                        name,
                        key,
                        size,
                        mimeType,
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

                const [row] = await db
                    .select()
                    .from(attachments)
                    .where(and(eq(attachments.id, id), eq(attachments.userId, session.user.id)))

                if (!row) return Response.json({ error: "Not found" }, { status: 404 })

                await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: row.key }))

                await db
                    .delete(attachments)
                    .where(eq(attachments.id, id))

                return new Response(null, { status: 204 })
            }
        }
    }
})
