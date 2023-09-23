const express = require('express');
const { name } = require('ejs');

const PORT = 8080;

const app = express();
app.use(express.static('static'));
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');

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