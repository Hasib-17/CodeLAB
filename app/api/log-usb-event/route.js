import mongoose from 'mongoose';
import UsbLog from '@/models/UsbLog';

export async function POST(req) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const body = await req.json();

        // Destructure all expected fields from request body
        const {
            studentId,
            event,
            time,
            locationId,
            vendorId,
            productId,
            deviceName,
            manufacturer,
            serialNumber,
            deviceAddress,
        } = body;

        // Basic validation
        if (!studentId || !event || !time) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: studentId, event, or time' }),
                { status: 400 }
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

        return new Response(JSON.stringify({ message: 'Logged', log }), { status: 201 });
    } catch (err) {
        console.error('POST /api/log-usb-event error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
}
