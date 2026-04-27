import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { r2, R2_BUCKET } from "@/lib/storage"

export const Route = createFileRoute("/api/storage/download-url")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const session = await auth.api.getSession({ headers: request.headers })
                if (!session) {
                    return Response.json({ error: "Unauthorized" }, { status: 401 })
                }

                const key = new URL(request.url).searchParams.get("key")
                if (!key) {
                    return Response.json({ error: "key is required" }, { status: 400 })
                }

                const url = await getSignedUrl(
                    r2,
                    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
                    { expiresIn: 3600 }
                )

                return Response.json({ url })
            }
        }
    }
})
