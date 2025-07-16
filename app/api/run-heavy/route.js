export async function POST(req) {
    const { code } = await req.json();

    const response = await fetch('http://127.0.0.1:5000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });

    const data = await response.json();
    return Response.json(data);
}
