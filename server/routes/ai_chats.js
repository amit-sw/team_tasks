import express from "express";
import { db, admin } from "../config/firebase.js";
import { ChatOpenAI } from "@langchain/openai";
import jwt from "jsonwebtoken";
import { Client } from "langsmith"; // Import Langsmith Client

const router = express.Router();

// Initialize Langsmith Client conditionally
if (process.env.LANGCHAIN_API_KEY && process.env.LANGCHAIN_TRACING_V2 === 'true') {
  const client = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
    // Langsmith project name can be set here or through LANGCHAIN_PROJECT env var
    // apiUrl: "https://api.smith.langchain.com", // Optional: defaults to this
  });
  // The client is initialized, but for basic tracing, Langchain relies on env vars.
  // No specific methods need to be called on 'client' for tracing chatModel.invoke
  console.log("Langsmith client initialized. Project:", process.env.LANGCHAIN_PROJECT || "Default Project (check LANGCHAIN_PROJECT env var)");
} else {
  if (process.env.LANGCHAIN_TRACING_V2 === 'true') {
    console.log("Langsmith tracing is enabled (LANGCHAIN_TRACING_V2=true), but LANGCHAIN_API_KEY is missing. Traces will not be sent to Langsmith.");
  }
}

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

    const openAIModel = process.env.OPENAI_MODEL;
    if (!openAIModel) {
      throw new Error('OPENAI_MODEL not set in environment');
    }
    
    // Initialize ChatOpenAI
    const chatModel = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      modelName: openAIModel,
    });
    
    // Call Langchain invoke
    const completion = await chatModel.invoke([
      { type: "system", content: systemPrompt },
      { type: "user", content: inputText }
]);
    
    aiResponse = completion.content;
  } catch (err) {
    console.error('[Langchain] Error getting AI response:', err);
    await db.collection('AI_chats').doc(chatId).update({ Response: 'Langchain error: ' + err.message });
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
