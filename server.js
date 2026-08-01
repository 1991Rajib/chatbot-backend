const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => res.send('Backend is running'));

app.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: message },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // free model
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = response.choices[0]?.message?.content?.trim() || 'No response';
    res.json({ 
      reply: aiReply, 
      usage: response.usage 
    });

  } catch (error) {
    console.error('Groq Error:', error.message);
    
    // Check for rate limit / token exhaustion
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      return res.status(429).json({ 
        error: 'You have exhausted your free AI tokens for now. Please wait a bit and try again.' 
      });
    }

    res.status(500).json({ 
      error: 'The AI system encountered an unexpected error. Please try again.' 
    });
  }
});

app.listen(5001, () => console.log('Server running on port 5001'));