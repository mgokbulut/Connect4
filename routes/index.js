var express = require('express');
var router = express.Router();
var WebSocket = require('ws');

/* GET home page. */
// when the site opens, this route redirects the user to the splash screen
router.get('/', function(req, res) {
  res.redirect('/splash');
});

router.get('/splash', function(req, res) {
  res.render('splash');
});


var loby = [];
var games_played = 0;
var shortest_game;
var nextSocketId = 0;
var connectedPlayerCount = 0;

router.get('/playerCount', function(req, res) {
  res.json({count: connectedPlayerCount});
});

router.get('/gamesPlayed', function(req, res) {
  res.json({count: games_played});
});

router.get('/shortestGame', function(req, res) {
  res.json({count: shortest_game});
});


router.get('/loby/:id?', function(req, res) {
  //to prevent users to access loby path, we need to check wheter they
  //have a cookie with the specified loby id. the cookie only can be recieved
  //trouch creating or joining a loby from splash screen
  var lobyID = req.signedCookies['loby'];
  if(typeof lobyID == 'undefined' || lobyID != req.params.id) {
    res.render('error', {message:"you are not authorized to use this path"});
  } else {
    var found = false;
    console.log(loby);
    
    loby.forEach((el) => {
      if(el.lobyID == lobyID){
        found = true;
      }
    });

    if(found) {
      res.cookie('loby', "", { maxAge: Date.now(), httpOnly: true, signed: true });
      res.render('loby', {lobyID:req.params.id});
      res.end("ok");
    } else {
      res.render('error', {message:"no such server exists"});
    }
    
  }

});

router.post('/createServer', function(req, res) {
  var nick = req.body.nick;
  var loby_id;
  var check = true;
  // checks if the generated loby id already exists
  while (check) {
    check = false;
    loby_id = Math.random().toString(36).substring(7);
    loby.forEach((item) => {
      if(item.lobyID == loby_id){
        check = true;
      }
    });
  }

  loby.push({
    lobyID:loby_id,
    playerNames:[nick],
    clients:[]
  });
  console.log(loby);
  //signs a cookie with loby id
  res.cookie('loby', loby_id, { maxAge: 20 * 60000, httpOnly: true, signed: true });
  res.json({id:'/loby/' + loby_id});

});

router.post('/joinServer', function(req, res) {
  var nick = req.body.nick;
  var loby_id = req.body.lobyID;
  var check = true;
  // tries to join to the loby
  for (let index = 0; index < loby.length; index++) {
    const element = loby[index];
    if(element.lobyID == loby_id){
      // if the second player has choosen the same nickname, send error message
      if(loby[index].playerNames[0] == nick){
        res.render('error', {message:"pick a different nickname"});
        return;
      } else {
        loby[index].playerNames.unshift(nick);
        res.cookie('loby', loby_id, { maxAge: 20 * 60000, httpOnly: true, signed: true });
        res.json({id:'/loby/' + loby_id});
        return;
      }
    }
  }

  res.render('error', {message:"there is no such loby"});
});




/////////////////////////////



const wss = new WebSocket.Server({
  port: 3001
});

// we want to log all errors
wss.on("error", (error) => {
console.log("Error has occured on socket:" + error);
});

// we use this to make our life easier, read on
function serializeSocketMessage(type, payload) {
return JSON.stringify({ type: type, payload: payload });
}


// this function is called everytime a new client connects
wss.on("connection", (ws, req) => {
  ws.send(serializeSocketMessage("handshake", "server says hi"));
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
      console.log("Server got a message: \n" + "--->type: " + type +"\n--->payload: " + payload )
      //console.log("Client says: " + type + ":" + payload);



      // This is the fun part
      // Here we define our client-to-server communication
      // Switch for each type (define these yourself).
      // maybe playerHasMoved? playerHasChosenUsername?, playerHasStartedGame?
      switch (type) {
        case "enterLoby":
            var lobi = payload.split(':');
            var nick = lobi[0];
            lobi = lobi[1];
            console.log(lobi);
            for (let index = 0; index < loby.length; index++) {
              const element = loby[index];
              if(element.lobyID == lobi) {
                ws.loby = element;
                element.clients.push(ws);
                console.log("successfully added to lobies clients!!");

                //if two players are connected, initiate the game
                if(ws.loby.clients.length == 2){
                  console.log("initiating game");

                  var i = 0;
                  var symbols = ["red", "yellow"];
                  ws.loby.clients.forEach(client => {
                    client.send(serializeSocketMessage("start", {symbol:symbols[i], opponentName:ws.loby.playerNames[i]}));
                    i++;
                  });
                }
                return;
              }
            }
            console.log("couldn'd be added to the loby");
        break;

        case "win":

          ws.loby.clients.forEach(client => {
            //because we do not want to send the content to the client it came from
            if(ws != client) {
              client.send(serializeSocketMessage("win", payload.board));
            }
          });
          if(games_played == 0 || payload.time < shortest_game) {
            shortest_game = payload.time;
            console.log(payload.time);
          }
          games_played++;
        break;

        case "draw":

          ws.loby.clients.forEach(client => {
            //because we do not want to send the content to the client it came from
            if(ws != client) {
              client.send(serializeSocketMessage("draw", payload));
            }
          });
          games_played++;
        break;

        case "update":


          ws.loby.clients.forEach(client => {
            if(ws != client) {
              client.send(serializeSocketMessage("update", payload));
            }
          });

        break;
      }


  }


  // this function closes whenever a client disconnects
  // e.g. user refreshes/closes page,
  ws.onclose = (ev) => {
      ws.loby.clients.forEach(client => {
        if(ws != client) {
          client.send(serializeSocketMessage("abord", ""));
        }
      });
      loby = loby.filter(function( obj ) {
        return obj.lobyID !== ws.loby.lobyID;
      });

      connectedPlayerCount--;
      console.log("Client disconnected!");

  }
});



///////////////////////////
module.exports = router;
