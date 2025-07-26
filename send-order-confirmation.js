Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { order_id, user_email, total, items } = await req.json();

    // Format order items for email
    const itemsHtml = items.map(item => 
      `<li>${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}</li>`
    ).join('');

    // Send email via Supabase
    const response = await fetch('https://icjqneahxmyurwizviaa.supabase.co/rest/v1/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljanFuZWFoeG15dXJ3aXp2aWFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMzMzQwMSwiZXhwIjoyMDY4OTA5NDAxfQ.0-MIR4sM5oL5lGWv4g_HZLkJ9V4OokKQYEdJD1qJkGo',
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljanFuZWFoeG15dXJ3aXp2aWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzM0MDEsImV4cCI6MjA2ODkwOTQwMX0.69uKkqcPIUTg22eazuE2U3P_dLE6PVBzHW0yWu53FQ8'
      },
      body: JSON.stringify({
        to: user_email,
        subject: `eShop Order #${order_id} Confirmation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563EB;">Thank you for your order!</h1>
            <p>Your order #${order_id} has been received and is being processed.</p>
            
            <h2 style="color: #2563EB; margin-top: 20px;">Order Summary</h2>
            <ul>
              ${itemsHtml}
            </ul>
            
            <p><strong>Total: ₹${total}</strong></p>
            
            <p>We'll send you another email when your order ships.</p>
            
            <p style="margin-top: 30px;">The eShop Team</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
