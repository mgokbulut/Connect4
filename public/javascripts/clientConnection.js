var server;
let lobyID;
let game;

$( document ).ready(function() {
    lobyID = window.location.href;
    var i = lobyID.length

    while(lobyID.charAt(i) != '/'){
        i--;
    }
    lobyID = lobyID.substring(i + 1, lobyID.length);
    //console.log(lobyID);
    var link = 'ws://localhost:3001';
    server = new WebSocket(link);
    // we know what this does already
    
    server.onerror = (error) => {
        console.log("An error has occured: " + error)
    }

    // we have to wrap our client-server communication
    // in the callback of onopen since this is all asynchronous
    // and connections don't open immediately
    server.onopen = (ev) => {
        console.log("Server connection opened");
        //sends a request to server to add the socket connection to the clients
        server.send(serializeSocketMessage("enterLoby", localStorage.nick + ":" + lobyID));
        // let's first listen for messages sent by the server

        server.onmessage = (message) => {

            // this is a copy/paste from the server
            var messageObject = JSON.parse(message.data);
            let { type, payload } = messageObject;

            // uncomment this line for easier debugging
            // console.log("Client got a message: \n" + "--->type: " + type +"\n--->payload: " + payload )

            // Again, here we define our own action types but this time
            // for server-to-client communication
            
            console.log('server says: ' + payload);



            switch (type) {
                case "start":
                    document.getElementById("waiting_message").style.visibility = "hidden";
                    document.getElementById('grid').style.visibility = "visible";

                    game = new connect4(payload.symbol, payload.opponentName);
                    if(game.yourTurn == true) {
                        document.getElementById("Turn").innerHTML = "Your Turn";
                    } else {
                        document.getElementById("Turn").innerHTML =  payload.opponentName + "'s Turn";
                    }

                    document.getElementById("Turn").style.visibility = "visible";

                break;

                case "update":

                    game.yourTurn = true;
                    document.getElementById("Turn").innerHTML = "Your Turn";
                    game.updateBoard(payload);
                    
                break;

                case "win":

                    game.gameFinished = true;
                    document.getElementById("Turn").innerHTML = "Game Has been won by " + game.opponentName;
                    game.updateBoard(payload);
                    document.getElementById("Splash_Screen").style.visibility = "visible";

                break;

                case "draw":

                    game.gameFinished = true;
                    document.getElementById("Turn").innerHTML = "Game has ended with draw";
                    game.updateBoard(payload);
                    document.getElementById("Splash_Screen").style.visibility = "visible";

                break;

                case "abord":

                    game.gameFinished = true;
                    document.getElementById("Turn").innerHTML = game.opponentName +" has left the game";
                    document.getElementById("Splash_Screen").style.visibility = "visible";

                break;
            }

        }


        /*

        var handshakePayload = "Hi im Joe";
        server.send(serializeSocketMessage("handshake", handshakePayload));

        */
    }


    
});


function serializeSocketMessage(type, payload) {
    return JSON.stringify({ type: type, payload: payload });
}

function re(){
    server.send(serializeSocketMessage("move", "deneme"));
}

  
  
  


////////////////////////////////////////////////////////////////




class connect4{

    EMPTY;
    gridX;
    gridY;
    board;
    table_DOM;
    connectLimit;
    gameFinished;
    yourTurn;
    symbol;
    opponentName;

    constructor(symbol, opponentName) {
      /**
       * gridx and gridy is the dimentions of the connect game
       * the board (an array) is going to hold the pieces
       * pieces is used as a queue. In every round, the next piece in the queue will use the turn
       * the used piece is enqueued to the pieces queue right after it is used.
       */
      this.EMPTY = '';
      this.gameFinished = false;
      this.gridX = 7;
      this.gridY = 6;
      this.connectLimit = 4;
      this.board = new Array(6 * 7);
      this.pieces = new Array(2);
      this.symbol = symbol;
      this.opponentName = opponentName;
      if(symbol == "red") {
        this.yourTurn = true;
      } else {
        this.yourTurn = false;
      }

      //initilizing each space of the board as Empty space
      for (let index = 0; index < (6 * 7); index++) {
          this.board[index] = "";
      }
      this.table_DOM = this.tableCreate();
    }
  
    play(rowNo) {
        if(this.yourTurn == true) {
            if(this.gameFinished == true) {
                alert("game is finished");
                return;
            }
            
            if(this.isBoardFull() == false) {
                var res = this.put(rowNo);
                if(res == true) {
                    //alert("The game has won by " + this.symbol);
                    server.send(serializeSocketMessage("win", game.getBoard()));
                    game.gameFinished = true;
                    game.yourTurn = false;
                    game.tableUpdate();
                    

                    document.getElementById("Turn").innerHTML = "Game Has been won by " + localStorage.nick;
                    document.getElementById("Splash_Screen").style.visibility = "visible";



                    return;
                } else if(res == false) {
                    //UPDATE THE VISUALS
                    server.send(serializeSocketMessage("update", game.getBoard()));
                    document.getElementById("Turn").innerHTML =  game.opponentName + "'s Turn";
                    this.yourTurn = false;
                    game.tableUpdate();
                } else {
                    console.log("column is full");
                }
            } else {
                this.gameFinished = true;
                server.send(serializeSocketMessage("draw", game.getBoard()));
                game.yourTurn = false;
                console.log("The game has finished with draw");
                //alert("The game has finished with draw");

                document.getElementById("Turn").innerHTML = "Game Has finished with draw";
                document.getElementById("Splash_Screen").style.visibility = "visible";
            }
        }
    }
    put(rowNo) {
      /**
       * Inserts the player piece to the board (this.board)
       */
    
      var piece = this.symbol;
      //if the given row number is outside of the range
      if(rowNo < 0 || rowNo >= this.gridX) {
          throw "Invalid Column Number, " + rowNo + " is out of the range";
      }
  
      //index start at negative
      let index = parseInt(rowNo) - parseInt(this.gridX);
  
      //finds the spot that the piece needs to be inserted in
      do {
          //jumps to the next row
          index += parseInt(this.gridX);
      } while (this.board[index] === this.EMPTY);
  
      //if the index is rowNo at the end, the row is full
      //this is due to the fact that the index starts at negative
      if(index === rowNo){
          throw "Row is full!";
      }
  
      //currently index holds the last occupied spot.
      index -= this.gridX;
      //now index hols the next available spot in the row.
      //Inserting the piece to the board:
      this.board[index] = piece;
  
      server.send(serializeSocketMessage("update", this.getBoard()));

      // Returns if the game has finished or not;
      return (this.checkEnd(piece, index));
    }
  
    checkEnd(piece, index) {
      // checks if the piece has won the game
      if(this.checkHorizontal(piece, index) == true) {
        return true;
      }
      if(this.checkVertical(piece, index) == true) {
        return true;
      }
      if(this.checkRightCross(piece, index) == true) {
        return true;
      }
      if(this.checkLeftCross(piece, index) == true) {
        return true;
      }
      return false;
    }
  
    checkRightCross(piece, index) {
    /**
     * Checks is the game is completed in Right cross aka '/'
     * note: this method is not tested yet.
     */
    // variables:
      let currentIndex = index;
      let currentModulo = currentIndex % this.gridX;
      //count will have the count on how many same piece in one row
      let count = 0;
  
          // -- check horizontal right & up -- //
      // if the piece is inserted to the first row.
      // this is done to dodge end of the row check aka (currentModulo != 0)
      // in the while loop
      if(currentModulo == 0) {
        currentIndex -= this.gridX - 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
  
      //while the next row the next element is in the same row
      //and while the piece is in the same row
      while(currentIndex >= 0 && currentModulo != 0 && this.board[currentIndex] == piece) {
        currentIndex -= this.gridX - 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
          // -- check horizontal left & down -- //
      currentIndex = index;
      currentModulo = currentIndex % this.gridX;
  
      if(currentModulo == (this.gridX - 1)) {
        currentIndex += this.gridX - 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
      // while its in the boudry of the array and the piece pattern continious
      while(currentIndex <= this.board.length - 1 && currentModulo != (this.gridX - 1) && this.board[currentIndex] == piece) {
        currentIndex += this.gridX - 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
      // cont - 1 because the index given is counted twice
      // once in right and once in left
      if(count - 1 >= this.connectLimit) {
        return true;
      }
      return false;
    }
  
    checkLeftCross(piece, index) {
    /**
     * Checks is the game is completed in Right cross aka '/'
     * note: this method is not tested yet.
     */
    // variables:
      let currentIndex = index;
      let currentModulo = currentIndex % this.gridX;
      //count will have the count on how many same piece in one row
      let count = 0;
  
          // -- check horizontal right & up -- //
      // if the piece is inserted to the first row.
      // this is done to dodge end of the row check aka (currentModulo != 0)
      // in the while loop
      if(currentModulo == 0) {
        currentIndex += this.gridX + 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
  
      //while the next row the next element is in the same row
      //and while the piece is in the same row
      while(currentIndex <= this.board.length - 1 && currentModulo != 0 && this.board[currentIndex] == piece) {
        currentIndex += this.gridX + 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
          // -- check horizontal left & down -- //
      currentIndex = index;
      currentModulo = currentIndex % this.gridX;
  
      if(currentModulo == (this.gridX - 1)) {
        currentIndex -= this.gridX + 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
      while(currentIndex >= 0 && currentModulo != (this.gridX - 1) && this.board[currentIndex] == piece) {
        currentIndex -= this.gridX + 1;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
      // cont - 1 because the index given is counted twice
      // once in right and once in left
      if(count - 1 >= this.connectLimit) {
        return true;
      }
      return false;
    }
  
    checkHorizontal(piece, index) {
    /**
     * Checks is the game is completed horizontally
     * note: this method is well tested.
     */
    // variables:
      let currentIndex = index;
      let currentModulo = currentIndex % this.gridX;
      //count will have the count on how many same piece in one row
      let count = 0;
  
          // -- check horizontal right -- //
      // if the piece is inserted to the first row.
      // this is done to dodge end of the row check aka (currentModulo != 0)
      // in the while loop
      if(currentModulo == 0) {
        currentIndex++;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
  
      //while the next row the next element is in the same row
      //and while the piece is in the same row
      while(currentModulo != 0 && this.board[currentIndex] == piece) {
        currentIndex++;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
          // -- check horizontal left -- //
      //check horizontal left
      currentIndex = index;
      currentModulo = currentIndex % this.gridX;
  
      if(currentModulo == (this.gridX - 1)) {
        currentIndex--;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
      while(currentModulo != (this.gridX - 1) && this.board[currentIndex] == piece) {
        currentIndex--;
        currentModulo = currentIndex % this.gridX;
        count++;
      }
  
      // cont - 1 because the index given is counted twice
      // once in right and once in left
      if(count - 1 >= this.connectLimit) {
        return true;
      }
      return false;
    }
  
    checkVertical(piece, index) {
    /**
     * Checks is the game is completed horizontally
     * note: this method is well tested.
     */
    // variables:
      let currentIndex = index;
      //count will have the count on how many same piece in one row
      let count = 0;
  
          // -- check vertical right -- //
  
  
      //while the next row the next element is in the same row
      //and while the piece is in the same row
      while(currentIndex <= this.board.length - 1 && this.board[currentIndex] == piece) {
        currentIndex += this.gridX;
        count++;
      }
  
          // -- check vartical left -- //
      currentIndex = index;
  
      while(currentIndex >= 0 && this.board[currentIndex] == piece) {
        currentIndex -= this.gridX;
        count++;
      }
  
      // cont - 1 because the index given is counted twice
      // once in right and once in left
      if(count - 1 >= this.connectLimit) {
        return true;
      }
      return false;
    }
  
    isBoardFull() {
      //check if the game board has totally filled
      this.board.forEach(element => {
          if(element == this.EMPTY) {
              return true;
          }
      });
      return false;
    }
  
    tableCreate() {
    $( "#grid" ).empty();
      //CREATE TABLE IN HTML BODY
      let index = 0;
      var grid = document.getElementById('grid');
      grid.style.visibility = 'visible';
      for (var i = 0; i < this.gridY; i++) {
        $('#grid').append('<div id="row'+ i + '" class="row"></div>');    
        for (var j = 0; j < this.gridX; j++) {
            if(this.board[index] == "red") {
                $('#row'+ i).append('<div class="cell" id="cell'+ index + '" onclick="game.play(' + j + ')" style="background-color:red;"></div>');
            } else if(this.board[index] == "yellow") {
                $('#row'+ i).append('<div class="cell" id="cell'+ index + '" onclick="game.play(' + j + ')" style="background-color:yellow;"></div>');
            } else {
                $('#row'+ i).append('<div class="cell" id="cell'+ index + '" onclick="game.play(' + j + ')" style="background-color:white;"></div>');
            }

            index++;
        }
      }
      return grid;
    }
    asd(){
        
      //CREATE TABLE IN HTML BODY
      let index = 0;
      var div = document.getElementById('game_table');
      var tbl = document.createElement('table');
      tbl.style.width = '70%';;
      tbl.setAttribute('border', '1');
      var tbdy = document.createElement('tbody');
      for (var i = 0; i < this.gridY; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < this.gridX; j++) {
          var td = document.createElement('td');
          td.appendChild(document.createTextNode(this.board[index]));
          index++;
          tr.appendChild(td);
        }
        tbdy.appendChild(tr);
      }
      tbl.appendChild(tbdy);
      div.appendChild(tbl)
      return tbl;
    }
  
    tableUpdate() {
      this.table_DOM = this.tableCreate();
    }
    getBoard() {
        return this.board;
    }
    updateBoard(payload) {
        this.board = payload;
        this.tableUpdate();
    }
  }
  