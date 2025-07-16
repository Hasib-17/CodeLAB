import mongoose from 'mongoose';
import UsbLog from '@/models/UsbLog';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from "next-auth/next";

export async function GET(req) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // ✅ Get logged in user from session
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401 }
            );
        }

        const studentId = session.user._id || "student123";

        // ✅ Fetch logs only for logged in user
        const logs = await UsbLog.find({ studentId }).sort({ time: -1 });

        return new Response(JSON.stringify(logs), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('GET /api/get-usb-logs error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
}
