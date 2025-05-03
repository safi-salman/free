// api/submit-result.js
const { Pool } = require('pg');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const examResult = req.body;
    
    // Ensure required fields exist
    if (!examResult.userName || !examResult.userEmail || !examResult.score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert exam result into database
    const query = `
      INSERT INTO exam_results 
      (name, email, exam_id, score, total_questions, correct_answers, incorrect_answers, skipped_answers, answers, time_spent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const values = [
      examResult.userName,
      examResult.userEmail,
      examResult.examId || 1,
      examResult.score,
      examResult.totalQuestions,
      examResult.correctAnswers,
      examResult.incorrectAnswers,
      examResult.skippedAnswers,
      JSON.stringify(examResult.answers),
      examResult.timeSpent,
      new Date().toISOString()
    ];
    
    const result = await pool.query(query, values);
    
    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving exam result:', error);
    return res.status(500).json({ error: 'Failed to save exam result' });
  }
};