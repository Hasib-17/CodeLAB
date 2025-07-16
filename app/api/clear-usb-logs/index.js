import mongoose from 'mongoose';
import UsbLog from '@/models/UsbLog';

export async function POST(req) {
    try {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
        }

        await UsbLog.deleteMany({ studentId: userId });

        return new Response(JSON.stringify({ message: 'Logs cleared' }), { status: 200 });
    } catch (err) {
        console.error('POST /api/clear-usb-logs error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
