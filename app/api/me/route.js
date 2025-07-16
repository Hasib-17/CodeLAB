import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify(session.user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
