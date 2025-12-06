require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// GET /api/voices
// Returns available ElevenLabs voices for the configured API key
app.get('/api/voices', async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  try {
    const url = 'https://api.elevenlabs.io/v1/voices';
    const resp = await axios.get(url, { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    // return raw body to client
    return res.json(resp.data);
  } catch (err) {
    console.error('ElevenLabs voices error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to fetch ElevenLabs voices', detail: err.message });
  }
});

// POST /api/tts
// body: { text }
// This endpoint proxies to ElevenLabs TTS. Set ELEVENLABS_API_KEY and ELEVEN_VOICE_ID in .env.
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!process.env.ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  const voiceId = process.env.ELEVEN_VOICE_ID || 'eleven_default';
  try {
    // NOTE: ElevenLabs API surface may change; adapt endpoint and payload to your account docs.
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const elevenResp = await axios.post(url, { text }, {
      responseType: 'arraybuffer',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      }
    });
    res.set('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(elevenResp.data, 'binary'));
  } catch (err) {
    console.error('ElevenLabs TTS error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'ElevenLabs TTS failed', detail: err.message });
  }
});

// POST /api/did
// body: { script, sourceUrl, presenterId (optional) }
// Proxies to D-ID talking-head API. Set DID_API_KEY in .env.
// Returns immediate response with talk_id and status.
app.post('/api/did', async (req, res) => {
  const { script, sourceUrl, presenterId } = req.body;
  if (!process.env.DID_API_KEY) return res.status(500).json({ error: 'DID_API_KEY not configured' });
  try {
    const apiUrl = 'https://api.d-id.com/talks';
    const payload = {
      script: { type: 'text', input: script },
      source_url: sourceUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=60'
    };
    if (presenterId) payload.presenter_id = presenterId;
    
    const didResp = await axios.post(apiUrl, payload, {
      headers: { Authorization: `Bearer ${process.env.DID_API_KEY}`, 'Content-Type': 'application/json' }
    });
    // D-ID returns { id, status, ... }
    return res.json(didResp.data);
  } catch (err) {
    console.error('D-ID request error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'D-ID request failed', detail: err.message });
  }
});

// GET /api/did/:talkId
// Poll for D-ID video generation status and result
app.get('/api/did/:talkId', async (req, res) => {
  const { talkId } = req.params;
  if (!process.env.DID_API_KEY) return res.status(500).json({ error: 'DID_API_KEY not configured' });
  try {
    const statusUrl = `https://api.d-id.com/talks/${encodeURIComponent(talkId)}`;
    const statusResp = await axios.get(statusUrl, {
      headers: { Authorization: `Bearer ${process.env.DID_API_KEY}` }
    });
    // Returns { id, status, result_url (when done), ... }
    return res.json(statusResp.data);
  } catch (err) {
    console.error('D-ID status error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'D-ID status check failed', detail: err.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Avanti proxy server listening on ${port}`));
