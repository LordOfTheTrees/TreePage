// Netlify Function: Export visit data for weekly sync
// Called by GitHub Actions to fetch recent visits from Supabase.
//
// Returns a bounded window of the most recent visits plus an exact all-time
// count. The window keeps the published payload a fixed size no matter how
// large the table grows; the count is queried separately so the dashboard's
// running total stays accurate rather than saturating at the window size.

const { createClient } = require('@supabase/supabase-js');

// Size of the published window. Also the ceiling PostgREST would impose
// anyway, so this is one request, never a truncated one.
const RECENT_VISIT_LIMIT = 1000;

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(500, { error: 'Supabase not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Exact all-time total. head: true fetches no rows, only the count.
    const { count, error: countError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Supabase count failed: ${countError.message}`);
    }

    // Newest first so the window tracks current traffic, then flipped back to
    // chronological order because every consumer reads it oldest-to-newest.
    const { data, error } = await supabase
      .from('visits')
      .select('country, region, city, timestamp')
      .order('timestamp', { ascending: false })
      .limit(RECENT_VISIT_LIMIT);

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    const visits = data.reverse();

    return jsonResponse(200, {
      visits,
      total: count,
      returned: visits.length,
      windowSize: RECENT_VISIT_LIMIT,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting visits:', error);
    return jsonResponse(500, { error: 'Failed to export visits' });
  }
};
