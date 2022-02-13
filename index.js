/**
 * The JWT token you get after authenticating with our API.
 * Check the Authentication section of the documentation for more details.
 */
const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjY2Nzk1MTIzMTUwNjg0MTYiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoic0ZUdDM5c2Q3a1NFY0VubVl0bnFxaWdXMVFkNUZROWJAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjQ0NzQ2MDY1LCJleHAiOjE2NDQ4MzI0NjUsImF6cCI6InNGVHQzOXNkN2tTRWNFbm1ZdG5xcWlnVzFRZDVGUTliIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.YOJegDb35Z1twNUwYDlQcjwegivYzpVWpo9xlms0j8FZxRjj0sn1Fi7hspxay-2Y_Svgdj3HjWA63JFItRbxdJirGjqw3ISiqGT0uiRX3QegPcVjfvHJ1cnBHYmO4hIkmAYY-q0WgjJUwR4Ji6PqvbGaEG0CZl-BrvY1wHPW9ere3Gui5y6jfp4ZZdeZUv4wB5dLg3ximp2A6Qx8ILTqzL78iYGHUqF5gVGBR16n5TTAAXDQ9ZjZ-48saiW-tSk7OjB7ydwoKvfyOe3I6KBvx-D3r9nWWvG5G_cmEylKyrv_EcNTTj6o2swhMyWsDi8GXIXnJSRxZVEs6e6_btGGMw"
const uniqueMeetingId = btoa("user@example.com")
const symblEndpoint = `wss://api.symbl.ai/v1/realtime/insights/${uniqueMeetingId}?access_token=${accessToken}`;

const ws = new WebSocket(symblEndpoint);

// Fired when a message is received from the WebSocket server
ws.onmessage = (event) => {
  // You can find the conversationId in event.message.data.conversationId;
  const data = JSON.parse(event.data);
  if (data.type === 'message' && data.message.hasOwnProperty('data')) {
    console.log('conversationId', data.message.data.conversationId);
  }
  if (data.type === 'message_response') {
    for (let message of data.messages) {
      console.log('Transcript (more accurate): ', message.payload.content);
    }
  }
  if (data.type === 'topic_response') {
    for (let topic of data.topics) {
      console.log('Topic detected: ', topic.phrases)
    }
  }
  if (data.type === 'insight_response') {
    for (let insight of data.insights) {
      console.log('Insight detected: ', insight.payload.content);
    }
  }
  if (data.type === 'message' && data.message.hasOwnProperty('punctuated')) {
    console.log('Live transcript (less accurate): ', data.message.punctuated.transcript)
  }
  console.log(`Response type: ${data.type}. Object: `, data);
};

// Fired when the WebSocket closes unexpectedly due to an error or lost connetion
ws.onerror  = (err) => {
  console.error(err);
};

// Fired when the WebSocket connection has been closed
ws.onclose = (event) => {
  console.info('Connection to websocket closed');
};

// Fired when the connection succeeds.
ws.onopen = (event) => {
  ws.send(JSON.stringify({
    type: 'start_request',
    meetingTitle: 'Websockets How-to', // Conversation name
    insightTypes: ['question', 'action_item'], // Will enable insight generation
    config: {
      confidenceThreshold: 0.5,
      languageCode: 'en-US',
      speechRecognition: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
      }
    },
    speaker: {
      userId: 'example@symbl.ai',
      name: 'Example Sample',
    }
  }));
};

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

/**
 * The callback function which fires after a user gives the browser permission to use
 * the computer's microphone. Starts a recording session which sends the audio stream to
 * the WebSocket endpoint for processing.
 */
const handleSuccess = (stream) => {
  const AudioContext = window.AudioContext;
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(1024, 1, 1);
  const gainNode = context.createGain();
  source.connect(gainNode);
  gainNode.connect(processor);
  processor.connect(context.destination);
  processor.onaudioprocess = (e) => {
    // convert to 16-bit payload
    const inputData = e.inputBuffer.getChannelData(0) || new Float32Array(this.bufferSize);
    const targetBuffer = new Int16Array(inputData.length);
    for (let index = inputData.length; index > 0; index--) {
        targetBuffer[index] = 32767 * Math.min(1, inputData[index]);
    }
    // Send audio stream to websocket.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(targetBuffer.buffer);
    }
  };
};


handleSuccess(stream);
