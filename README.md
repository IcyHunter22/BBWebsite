Avanti proxy server — D-ID and ElevenLabs scaffold

This small Express server provides a secure proxy for ElevenLabs TTS and D-ID talking-head API calls. It keeps API keys on the server (do NOT store them in client JavaScript).

Files
- index.js — main server implementation with endpoints:
  - POST /api/tts  — returns MP3/Audio bytes from ElevenLabs for given { text }
  - POST /api/did  — starts a D-ID talking head creation job for { script, sourceUrl, presenterId }
  - GET /api/did/:talkId — polls D-ID job status and returns job metadata / result_url when ready

Quickstart
1. Install dependencies

   npm install

2. Copy env example and set keys

   cp .env.example .env
   # edit .env and add your ELEVENLABS_API_KEY and DID_API_KEY

3. Start the server

   npm start

Notes and integration tips
- ElevenLabs TTS: the current endpoint returns full audio as an ArrayBuffer. For lower latency real-time TTS, consider ElevenLabs' streaming options or implement a WebSocket proxy that streams chunks to the browser and uses WebAudio for playback.
- D-ID: generation is not instant — typical generation time may be several seconds. This server returns the D-ID job id immediately; the client should poll `/api/did/:talkId` for status and the resulting `result_url` when `status === 'done'`.
- Security: keep API keys secret. For production, add authentication, rate-limiting, and usage quotas.

Advanced: Real-time avatar suggestions
- To achieve a Confetto.ai–like live avatar with accurate lip sync:
  1. Use a low-latency TTS stream (ElevenLabs streaming or a WebSocket proxy) to continuously send audio chunks to the browser.
  2. On the client, play streamed audio via the WebAudio API and use an AnalyserNode to drive mouth shapes in real-time.
  3. For frame-perfect lip sync, generate viseme timings on the server (using an ASR/phoneme library) or approximate them client-side from the text and drive mouth shapes accordingly.

This scaffold is intended for prototyping and local development only.
