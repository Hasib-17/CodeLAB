import fs from 'fs';
import path from 'path';

export async function POST(req) {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'usb-detector', 'current-user.txt');
        fs.writeFileSync(filePath, userId, 'utf8');
        return new Response(JSON.stringify({ ok: true }));
    } catch (error) {
        console.error('Failed to write userId file:', error);
        return new Response(JSON.stringify({ error: 'Failed to save userId' }), { status: 500 });
    }
}
