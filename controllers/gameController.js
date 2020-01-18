module.exports = (portNo) => {
    console.log('controller fired with port:' + portNo);
    var WebSocket = require('ws');

    const wss = new WebSocket.Server({
        port: portNo
    });
      
    // we want to log all errors
    wss.on("error", (error) => {
    console.log("Error has occured on socket:" + error);
    });
    
    // we use this to make our life easier, read on
    function serializeSocketMessage(type, payload) {
    return JSON.stringify({ type: type, payload: payload });
    }
    
    var connectedPlayerCount = 0;
    
    // this function is called everytime a new client connects
    wss.on("connection", (ws, request) => {
    
    console.log(req.url);
    
    connectedPlayerCount++;
    
    console.log("Client connected; Total player count: " + connectedPlayerCount);
    
    // this function is called every time that particular client sends a message
    ws.onmessage = (message) => {
        // Since the websocket protocol only supports string messages,
        // this boilerplate is here to make our life easier.
        // The client sends serialized JSON objects with propeties type and payload.
    
        // This line parses it
        var messageObject = JSON.parse(message.data);
    
        // This is equivalent to saying 
        // let type = messageObject.type;
        // let payload = messageObject.payload;
        let { type, payload } = messageObject;
    
        // uncomment this line for easier debugging
        // console.log("Server got a message: \n" + "--->type: " + type +"\n--->payload: " + payload )
        console.log("Client says: " + type + ":" + payload);
    
    
        // This is the fun part
        // Here we define our client-to-server communication
        // Switch for each type (define these yourself).
        // maybe playerHasMoved? playerHasChosenUsername?, playerHasStartedGame?
    
    }
    
    
    // this function closes whenever a client disconnects
    // e.g. user refreshes/closes page,
    ws.onclose = (ev) => {
        console.log("Client disconnected!");
        connectedPlayerCount--;
        
    }
    
    });




};
