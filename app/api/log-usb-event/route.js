// app/api/log-usb-event/route.js
import mongoose from 'mongoose';
import UsbLog from '@/models/UsbLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const body = await req.json();

        // try to get session (optional) so we can fallback to session user id if body.studentId missing
        let session = null;
        try {
            session = await getServerSession(authOptions);
        } catch (e) {
            // ignore session errors; we'll still proceed if body.studentId provided
            console.warn('log-usb-event: getServerSession error (continuing if body.studentId provided):', e);
        }

        // Determine studentId: prefer body.studentId, otherwise try session user id/_id/email
        const studentId =
            body?.studentId ||
            session?.user?._id ||
            session?.user?.id ||
            session?.user?.email ||
            null;

        const {
            event,
            time,
            locationId,
            vendorId,
            productId,
            deviceName,
            manufacturer,
            serialNumber,
            deviceAddress,
        } = body ?? {};

        // Basic validation: require studentId (either in body or session), event, and time
        if (!studentId || !event || !time) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: studentId (or session), event, or time' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Create log document with all fields, converting time to Date
        const log = await UsbLog.create({
            studentId,
            event,
            time: new Date(time),
            locationId,
            vendorId,
            productId,
            deviceName,
            manufacturer,
            serialNumber,
            deviceAddress,
        });

        return new Response(JSON.stringify({ message: 'Logged', log }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('POST /api/log-usb-event error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
