/**
 * The JWT token you get after authenticating with our API.
 * Check the Authentication section of the documentation for more details.
 */
const accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlFVUTRNemhDUVVWQk1rTkJNemszUTBNMlFVVTRRekkyUmpWQ056VTJRelUxUTBVeE5EZzFNUSJ9.eyJodHRwczovL3BsYXRmb3JtLnN5bWJsLmFpL3VzZXJJZCI6IjY2Nzk1MTIzMTUwNjg0MTYiLCJpc3MiOiJodHRwczovL2RpcmVjdC1wbGF0Zm9ybS5hdXRoMC5jb20vIiwic3ViIjoic0ZUdDM5c2Q3a1NFY0VubVl0bnFxaWdXMVFkNUZROWJAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcGxhdGZvcm0ucmFtbWVyLmFpIiwiaWF0IjoxNjQ0NjQ1OTEyLCJleHAiOjE2NDQ3MzIzMTIsImF6cCI6InNGVHQzOXNkN2tTRWNFbm1ZdG5xcWlnVzFRZDVGUTliIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.CIUq0_C0dMUWLZg7DyVZSzzg1bcCEWSM-aWSZtavklR3G4TVKhdD4bQuG457QXqWg8QgoCuJo2pXtWMVTxhKpTWlch9W3sz5vu-Cl-ScV6lr9nymERJScayJLRBU674sTidr7bWJ-BqWgQafti1_yQ_urN_l9pwwPYd6P3eDpdLGkPSGIiKZIluGma2UcRmxtZxMD5If2OC1JDuYAtBpU-kFYaNkxx-1zvAGkMw2K3N76P1H4lNqod25WVl-VV73jbfvJnZk_JzfqAVPK_oO616ndatay7H0nB75vGV8npzpPL_x0I5q8Wj2BR9wiEiDOLUknEmNPartVtLpHPXKjg";
const uniqueMeetingId = btoa("user@example.com");
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