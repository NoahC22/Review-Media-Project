const express = require('express');
const { name } = require('ejs');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const PORT = 8080;

const uri = "mongodb+srv://NoahC22:celrtnve22!C@cluster0.86340go.mongodb.net/"
const client = new MongoClient(uri);

(async function ()
{
        await client.connect();
})();

const app = express();
app.use(express.static('static'));
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(session({secret: 'superSecret', resave: false, saveUninitialized: false}));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', async (req, res) => {
    res.redirect('/home')
})

app.get('/home', async (req,res) => {
    res.render('homepage')
})

app.get('/list', async (req, res) => {
    res.render('list_of_reviews')
})

app.get('/login', async (req, res) => {
    res.render('login')
})

app.get('/signup', async (req, res) => {
    res.render('signup')
})

app.get('/user', async (req, res) => {
    res.render('user')
})

app.get('/review', async (req, res) => {
    res.render('review_page')
})

app.get('/add', async (req, res) => {
    res.render('add_review')
})

app.all('*', async (req, res) => {
    res.sendStatus(404);
});


app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));