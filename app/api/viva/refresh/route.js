// app/api/viva/refresh/route.js
import dbConnect from '@/utils/dbConnect';
import { VivaCourse } from '@/models/VivaCourse';

export async function DELETE(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const courseCode = url.searchParams.get('courseCode');
        if (!courseCode) {
            return new Response(JSON.stringify({ error: 'courseCode is required' }), { status: 400 });
        }

        const removed = await VivaCourse.findOneAndDelete({ courseCode }).lean();

        return new Response(JSON.stringify({ ok: true, removed: !!removed }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
