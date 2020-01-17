module.exports = (app) => {

const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//Rendering the ejs template at localhost:3000/questions
app.get('/game', (req, res) => {
    res.render('game');
});

//answering post request from questions
app.post('/questions', urlencodedParser, (req, res) => {
    //console.log(res.params.question);
    //console.log(req);
    console.log('success - post request has arrived');
    console.log(req.body.question);

    res.json({transmission: 'success'});
});






};
