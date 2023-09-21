const express = require('express');
const { name } = require('ejs');

const PORT = 8080;

const app = express();
app.use(express.static('static'));
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');

app.get('/home', async (req,res) => {
    res.render('homepage')
})

app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));