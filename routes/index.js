var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('/splash');
});

router.get('/splash', function(req, res) {
  res.render('splash');
});


const loby = [];
var games_played;
var shortest_game;

router.get('/loby/:id?', function(req, res) {
  //to prevent users to access loby path, we need to check wheter they
  //have a cookie with the specified loby id. the cookie only can be recieved
  //trouch creating or joining a loby from splash screen
  var lobyID = req.signedCookies['loby'];
  if(typeof lobyID == 'undefined' || lobyID != req.params.id) {
    res.render('error', {message:"you are not authorized to use this path"})
  } else {
    res.render('loby', {lobyID:req.params.id});
    res.end("ok");
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
    playerNames:[nick]
  });

  //signs a cookie with loby id
  res.cookie('loby', loby_id, { maxAge: 300000, httpOnly: true, signed: true });
  res.json({id:'/loby/' + loby_id});

});

module.exports = router;



class connect4{

    constructor(gridX, gridY, connectLimit, NoOfPieces) {
        /**
         * gridx and gridy is the dimentions of the connect game
         * the board (an array) is going to hold the pieces
         * pieces is used as a queue. In every round, the next piece in the queue will use the turn
         * the used piece is enqueued to the pieces queue right after it is used.
         */
        this.EMPTY = "";
        this.gameFinished = false;
        this.gridX = gridX;
        this.gridY = gridY;
        this.connectLimit = connectLimit;
        this.board = new Array(gridX * gridY);
        this.pieces = new Array(NoOfPieces);

        //assigning pieces to a unique id for each piece (for each player);
        for (let index = 0; index < NoOfPieces; index++) {
            //because 0 can be understand as null in some cases therefore
            //starting the index of the player at 1 secures any problem that may cause.
            this.pieces[index] = index + 1;
        }
        //initilizing each space of the board as Empty space
        for (let index = 0; index < (gridX * gridY); index++) {
            this.board[index] = "";
        }
        this.table_DOM = this.tableCreate();
    }

    play(rowNo) {

      if(this.gameFinished == true) {
        alert("game is finished");
        return;
      }

      if(this.isBoardFull() == false) {
        var turn = this.getTurn();
        if(this.put(turn, rowNo) == true) {
          this.tableUpdate();
          alert("The game has won by " + turn);
          return;
        }
        //UPDATE THE VISUALS
        this.tableUpdate();
      } else {
        this.gameFinished = true;
        console.log("The game has finished with draw");
      }
    }
    put(piece, rowNo) {
        /**
         * Inserts the player piece to the board (this.board)
         */

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

    getTurn() {
        /**
         * pieces works as a queue
         * next person in line is at the start of the array
         * after it is dequeued, it is added to the end of the queue for feature turns
         */
        let turn = this.pieces[0];
        this.pieces = this.pieces.splice(-1,1);
        this.pieces.push(turn);
        return turn;
    }
    reverseTurn(){
      //make the funtion to reverse the pieces so when an exception is thrown, we can get back to the old layout2
    }
    tableCreate() {
        //CREATE TABLE IN HTML BODY
        let index = 0;
        var body = document.getElementsByTagName('body')[0];
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
        body.appendChild(tbl)
        return tbl;
    }

    tableUpdate() {
        document.getElementsByTagName('body')[0].removeChild(this.table_DOM);
        this.table_DOM = this.tableCreate();
    }

}
