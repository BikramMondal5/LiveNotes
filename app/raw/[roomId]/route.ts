import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(context.params);
        const roomId = resolvedParams?.roomId;

        if (!roomId) {
            return new Response("Missing room ID", {
                status: 400,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }

        let dbUrl =
            process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
            "https://livenotes-b31fe-default-rtdb.asia-southeast1.firebasedatabase.app";

        if (dbUrl.endsWith("/")) {
            dbUrl = dbUrl.slice(0, -1);
        }

        const res = await fetch(`${dbUrl}/rooms/${encodeURIComponent(roomId)}/notes.json`, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            return new Response(`Failed to fetch room "${roomId}" from database.`, {
                status: res.status,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }

        const data = await res.json();

        if (data === null || typeof data !== "string") {
            return new Response(`Room "${roomId}" not found or has no text notes.`, {
                status: 404,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }

        return new Response(data, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": `attachment; filename="${roomId}.txt"`,
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (error) {
        console.error("Error retrieving room raw notes:", error);
        return new Response("Internal server error", {
            status: 500,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    }
}

