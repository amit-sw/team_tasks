import express from "express";
import { db, admin } from "../config/firebase.js";
import OpenAI from "openai";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to require authentication
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      // Use the jwt module imported at the top of the file
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  if (!req.user || (!req.user.id && !req.user.email)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/ai-chats
router.post('/', requireAuth, async (req, res) => {
  const { inputText } = req.body;
  if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
    return res.status(400).json({ error: 'inputText is required' });
  }
  const user_id = req.user.email || req.user.id;
  const now = admin.firestore.FieldValue.serverTimestamp();
  let chatRef = null;
  let chatId = null;
  try {
    // 1. Save user input in AI_chats
    const doc = {
      user_id,
      inputText,
      createdAt: now,
      updated_at: now
    };
    chatRef = await db.collection('AI_chats').add(doc);
    chatId = chatRef.id;
  } catch (err) {
    console.error('[AI_CHATS] Error saving user input:', err);
    return res.status(500).json({ error: 'Failed to save user input', details: err.message });
  }

  let systemPrompt = '';
  try {
    // 2. Fetch latest AI_prompts record
    const promptSnap = await db.collection('AI_prompts')
      .where('prompt_name', '==', 'AI_Tasks')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (promptSnap.empty) {
      throw new Error('No active AI_Tasks prompt found');
    }
    systemPrompt = promptSnap.docs[0].data().text;
  } catch (err) {
    console.error('[AI_PROMPTS] Error fetching system prompt:', err);
    await db.collection('AI_chats').doc(chatId).update({ Response: 'Prompt fetch error: ' + err.message });
    return res.status(500).json({ error: 'Failed to fetch system prompt', details: err.message });
  }

  let aiResponse = '';
  try {
    // 3. Call OpenAI API directly
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not set in environment');
    }
    
    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey
    });
    
    // Call chat completions API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputText }
      ],
      temperature: 0.7,
    });
    
    aiResponse = completion.choices[0].message.content;
  } catch (err) {
    console.error('[OpenAI] Error getting AI response:', err);
    await db.collection('AI_chats').doc(chatId).update({ Response: 'OpenAI error: ' + err.message });
    return res.status(500).json({ error: 'Failed to get AI response', details: err.message });
  }

  try {
    // 4. Save response in AI_chats record
    await db.collection('AI_chats').doc(chatId).update({ Response: aiResponse });
  } catch (err) {
    console.error('[AI_CHATS] Error saving AI response:', err);
    return res.status(500).json({ error: 'Failed to save AI response', details: err.message });
  }

  // 5. Return response to frontend
  res.json({ success: true, response: aiResponse });
});

export default router;
