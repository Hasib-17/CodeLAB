// app/api/get-usb-logs/route.js
import mongoose from 'mongoose';
import UsbLog from '@/models/UsbLog';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';

export async function GET(req) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // Get server session
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Determine possible session identities
        const sessionIds = new Set();
        if (session.user._id) sessionIds.add(String(session.user._id));
        if (session.user.id) sessionIds.add(String(session.user.id));
        if (session.user.email) sessionIds.add(String(session.user.email));

        // Parse optional query param userId (client can pass ?userId=...) but we only accept it if it matches session
        const url = new URL(req.url);
        const qUserId = url.searchParams.get('userId') || url.searchParams.get('studentId') || null;

        // Resolve studentId to query
        let studentId = null;
        if (qUserId) {
            // only honor explicit userId if it matches one of the session identities
            if (sessionIds.has(qUserId)) {
                studentId = qUserId;
            } else {
                // not allowed to request logs for other users
                return new Response(
                    JSON.stringify({ error: 'Forbidden: cannot request logs for another user' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } else {
            // no query provided, use session identity
            // prefer _id then id then email
            studentId = session.user._id || session.user.id || session.user.email || null;
        }

        if (!studentId) {
            return new Response(
                JSON.stringify({ error: 'Could not determine student identity' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Fetch logs for this student
        // limit is optional; you can change or pass ?limit=100
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? Math.min(1000, parseInt(limitParam, 10) || 200) : 500;

        const logs = await UsbLog.find({ studentId })
            .sort({ time: -1 })
            .limit(limit)
            .lean()
            .exec();

        return new Response(JSON.stringify(logs), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('GET /api/get-usb-logs error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
