import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { r2, R2_BUCKET } from "@/lib/storage"

export const Route = createFileRoute("/api/storage/upload-url")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) {
                    return Response.json({ error: "Unauthorized" }, { status: 401 })
                }

                const body = await request.json()
                const key: string = body?.key
                const contentType: string = body?.contentType

                if (!key || !contentType) {
                    return Response.json(
                        { error: "key and contentType are required" },
                        { status: 400 }
                    )
                }

                const url = await getSignedUrl(
                    r2,
                    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
                    { expiresIn: 3600 }
                )

                return Response.json({ url, key })
            }
        }
    }
})
