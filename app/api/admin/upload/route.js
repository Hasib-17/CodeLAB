// app/api/admin/upload/route.js
import { parse } from 'csv-parse/sync';
import dbConnect from '@/utils/dbConnect';    // <-- use your Mongoose helper
import MCQuestion from '@/models/MCQuestion';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        await dbConnect(); // <-- connect using mongoose

        const formData = await req.formData();
        const file = formData.get('file');
        let batchId = formData.get('batchId') || null; // optional
        if (!file) return new Response(JSON.stringify({ error: 'file required' }), { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const text = buffer.toString('utf8');

        // parse CSV (first row columns)
        const records = parse(text, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            escape: '\\'  // <-- add this line
        });

        // generate batchId if not provided
        if (!batchId) batchId = `batch_${Date.now()}`;

        const bulkOps = records.map(r => {
            // expected CSV columns: id, question, options, correctOption, points
            let opts;
            try {
                opts = JSON.parse(r.options);
            } catch {
                // allow pipe separated options: A|B|C|D
                opts = (r.options || '').split('|').map(s => s.trim()).filter(Boolean);
            }
            const correct = Number.isFinite(Number(r.correctOption)) ? Number(r.correctOption) : (r.correctOption ? Number(r.correctOption) : 0);

            return {
                updateOne: {
                    filter: { qid: r.id || (r.question && r.question.substring(0, 60)), batchId, text: r.question },
                    update: {
                        $set: {
                            qid: r.id || undefined,
                            batchId,
                            text: r.question,
                            options: opts,
                            correctIndex: correct,
                            points: Number(r.points || 1)
                        }
                    },
                    upsert: true
                }
            };
        });

        if (bulkOps.length) {
            await MCQuestion.bulkWrite(bulkOps);
        }

        return new Response(JSON.stringify({ ok: true, batchId, inserted: bulkOps.length }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err.message) }), { status: 500 });
    }
}
