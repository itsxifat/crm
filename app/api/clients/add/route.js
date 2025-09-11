import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db('en_crm');

    const newClient = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      website: body.website || null,
      pageLink: body.pageLink || null,
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
      priority: body.priority || 'Normal',
      createdAt: new Date(),
    };

    const result = await db.collection('clients').insertOne(newClient);

    return new Response(JSON.stringify({ success: true, clientId: result.insertedId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to add client' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
