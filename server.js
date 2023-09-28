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
    let x = req.session.user

    if(x == undefined) {
        res.render('homepage')
    } else {
        res.render('homepage')
    }
})

app.get('/list', async (req, res) => {
    let x = req.session.user

    if(x == undefined) {
        res.redirect('/home')
    } else {
        res.render('list_of_reviews')
    }
})

app.get('/login', async (req, res) => {
    let x = req.session.user;
	if(x == undefined) {
		res.render('login')
	}
	else {
		res.redirect('/home')
	}
})

app.post('/loginform', async (req, res) => {

    let loginu = req.body.loginusername;
	let loginp = req.body.loginpassword;
    let get_in = true;

    if(loginu == "") {
        get_in = false;
    }

    const info = await client.db("Review_Media").collection("Users").findOne({ username: `${loginu.toLowerCase()}`})
    if(info == null) {
        get_in = false
    }

    if(get_in == true) {
        let compare = await bcrypt.compare(loginp, info.password);

        if(compare == true) {
            const lguser = await client.db("Review_Media").collection("Users").findOne({ username: `${loginu.toLowerCase()}`})
            req.session.user = lguser
            res.redirect('/home')
        } else {
            res.render('login', {
                username: loginu,
			    failed: "Wrong!"
            })
        }
    } else {
        res.render('login', {
            failed: "Wrong!"
        })
    }
})

app.get('/signup', async (req, res) => {
    let x = req.session.user;
	if(x == undefined) {
		res.render('signup')
	}
	else {
		res.redirect('/home')
	}
})

app.post('/signupform', async (req, res) => {

    let new_user = req.body.signupusername;
    let new_pass = req.body.signuppassword;
    let new_passconfirm = req.body.signuppasswordconfirm
    let success = true;
    let listoferrors = [];

    if(new_user.length < 6) {
        success = false;
        listoferrors.push("Username needs to be 6 or more characters.")
    }

    let test1 = await client.db("Review_Media").collection("Users").findOne({ username: `${new_user.toLowerCase()}`});

    if(test1 != null) {
        success = false;
        listoferrors.push("Account already exists.")
    }

    if((/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/).test(new_pass) == false) {
        success = false;
        listoferrors.push("Password must contain 1 special character, 1 number, and the length has to be between 6 to 16 characters.")
    }

    if(new_pass != new_passconfirm) {
        success = false;
        listoferrors.push("Passwords don't match, couldn't confirm.")
    }

    if (success == true) {

        let hash = await bcrypt.hash(new_pass, 10);

        let new_u = {
            username: new_user.toLowerCase(),
            password: hash,
        }

        await client.db("Review_Media").collection("Users").insertOne(new_u)

        let au = await client.db("Review_Media").collection("Users").findOne({ username: `${new_user.toLowerCase()}`})
        req.session.user = au;

        res.redirect('/home')
    } else {
        res.render('signup', {
            username: new_user,
			errors: listoferrors
        })
    }

})

app.get('/logout', (req,res) => {
	delete req.session.user;
    res.redirect('/home');
});

app.get('/user', async (req, res) => {
    let x = req.session.user

    if(x == undefined) {
        res.redirect('/home')
    } else {
        res.render('user')
    }
})

app.get('/review', async (req, res) => {
    let x = req.session.user

    if(x == undefined) {
        res.redirect('/home')
    } else {
        res.render('review_page')
    }
})

app.get('/add', async (req, res) => {
    let x = req.session.user

    if (x == undefined) {
        res.redirect('/home')
    } else {
        res.render('add_review')
    }
})

app.all('*', async (req, res) => {
    res.sendStatus(404);
});


app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));