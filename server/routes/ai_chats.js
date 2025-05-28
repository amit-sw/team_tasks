import express from "express";
import { db, admin } from "../config/firebase.js";
import { ChatOpenAI } from "@langchain/openai";
import jwt from "jsonwebtoken";
import { Client } from "langsmith"; // Import Langsmith Client
import { listTasks, addTask, updateTask } from "../tools/task_tools.js";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

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

  const systemPrompt = "You are an expert Task manager. Given the user input, first understand the user's goal. Then, use the available tools to perform actions like listing, adding, or updating tasks in Firebase to help the user achieve their goal. Respond with a summary of the actions taken and the results. If you receive a function call response, you MUST return a string that is directly usable by the user.";

  // Define tools for Langchain
  const tools = [
    {
      type: "function",
      function: {
        name: "listTasks",
        description: "Lists all tasks for the current user.",
        parameters: { type: "object", properties: {}, required: [] }, // No specific parameters needed from LLM besides knowing to call it. UserId is added server-side.
      },
    },
    {
      type: "function",
      function: {
        name: "addTask",
        description: "Adds a new task for the current user.",
        parameters: {
          type: "object",
          properties: {
            taskData: {
              type: "string",
              description: "A JSON string representing the task data. Must include 'title'. Optional fields: 'description', 'notes', 'status' (defaults to 'active'). Example: { \"title\": \"Buy groceries\", \"description\": \"Milk, eggs, bread\" }",
            },
          },
          required: ["taskData"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "updateTask",
        description: "Updates an existing task for the current user.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "The ID of the task to update." },
            updateData: {
              type: "string",
              description: "A JSON string representing the fields to update. Example: { \"status\": \"completed\", \"notes\": \"All done!\" }",
            },
          },
          required: ["taskId", "updateData"],
        },
      },
    },
  ];

  let aiResponse = '';
  try {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not set in environment');
    }
    
    const chatModel = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      modelName: process.env.OPENAI_MODEL,
    }).bindTools(tools); // Bind tools to the model

    let messages = [
      new HumanMessage({ content: `System Prompt: ${systemPrompt}\nUser input: ${inputText}` }),
    ];
    
    // Initial LLM call
    let modelResponse = await chatModel.invoke(messages);
    messages.push(modelResponse); // Add AI's response to message history

    // Tool execution loop (if tool calls are present)
    if (modelResponse.tool_calls && modelResponse.tool_calls.length > 0) {
      const toolMessages = [];
      for (const toolCall of modelResponse.tool_calls) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.args;
        let toolResultContent = "";

        console.log(`Attempting to call tool: ${toolName} with args:`, toolArgs);

        try {
          if (toolName === "listTasks") {
            const result = await listTasks(user_id); // user_id from requireAuth
            toolResultContent = JSON.stringify(result);
          } else if (toolName === "addTask") {
            if (!toolArgs.taskData) throw new Error("taskData is required for addTask.");
            const result = await addTask(user_id, toolArgs.taskData);
            toolResultContent = JSON.stringify(result);
          } else if (toolName === "updateTask") {
            if (!toolArgs.taskId || !toolArgs.updateData) throw new Error("taskId and updateData are required for updateTask.");
            const result = await updateTask(user_id, toolArgs.taskId, toolArgs.updateData);
            toolResultContent = JSON.stringify(result);
          } else {
            console.error(`Unknown tool called: ${toolName}`);
            toolResultContent = `Error: Unknown tool '${toolName}' requested.`;
          }
        } catch (toolError) {
          console.error(`Error executing tool ${toolName}:`, toolError);
          toolResultContent = `Error executing tool ${toolName}: ${toolError.message}`;
        }
        
        toolMessages.push(new ToolMessage({ tool_call_id: toolCall.id, content: toolResultContent }));
      }
      
      messages = messages.concat(toolMessages); // Add tool results to message history
      modelResponse = await chatModel.invoke(messages); // Second LLM call with tool results
      messages.push(modelResponse); // Add final AI response to history
    }
    
    aiResponse = modelResponse.content;

  } catch (err) {
    console.error('[Langchain/ToolCall] Error getting AI response:', err);
    // Ensure aiResponse has a fallback if it's critical for DB update
    aiResponse = `Error processing your request: ${err.message}`; 
    await db.collection('AI_chats').doc(chatId).update({ Response: aiResponse, error: err.message, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.status(500).json({ error: 'Failed to get AI response', details: err.message });
  }

  try {
    // 4. Save final response (and potentially message history) in AI_chats record
    await db.collection('AI_chats').doc(chatId).update({ 
      Response: aiResponse, 
      // messages: messages.map(m => m.toJSON()), // Optionally save full message history
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
  } catch (err) {
    console.error('[AI_CHATS] Error saving final AI response:', err);
    // Don't return here if we already sent an error response during Langchain/ToolCall phase
    // but log it for server visibility. If the error is only here, then return.
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to save AI response', details: err.message });
    } else {
      console.error("Response already sent, but failed to save AI response to DB for chatId:", chatId);
    }
  }

  // 5. Return response to frontend
  res.json({ success: true, response: aiResponse });
});

export default router;
