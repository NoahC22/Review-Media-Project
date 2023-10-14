const express = require('express');
const { name } = require('ejs');
const fs = require('fs')
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })

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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({secret: 'superSecret', resave: false, saveUninitialized: false}));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

app.get('/', async (req, res) => {
    res.redirect('/home')
})

app.get('/home', async (req,res) => {
    let x = req.session.user

    if(x == undefined) {
        res.render('homepage')
    } else {
        let submissions = await client.db("Review_Media").collection("Reviews").find({}).toArray();
        submissions = submissions.reverse()
        res.render('homepage', {
            user: x,
            reviews: submissions
        })
    }
})

app.post('/home_search', async (req, res) => {
    let x = req.body.search
    //console.log(x)
    //x = x.toLowerCase()
    let info = await client.db("Review_Media").collection("Reviews").find({ review_title: {$regex: x}}).toArray();
    info = info.reverse()
    res.json(info)
})

app.get('/list/:user', async (req, res) => {

    let x = req.session.user;
	if(x == undefined) {
		res.redirect('/home')
	}
	else {
        const uname = req.params["user"].toLowerCase();
        const result = await client.db("Review_Media").collection("Reviews").find({ username: uname}).toArray();
        let suser = false;
        if(req.session.user.username == uname) {
            suser = true;
        }
        res.render('list_of_reviews', {
            rvs: result,
            showuser: suser
        })
    }
})

app.get('/delete/:id', async (req, res) => {
    let x = req.session.user;
    if (x == undefined) {
        res.redirect('/home')
    } else {
        const rid = req.params["id"];
        const cinfo = await client.db("Review_Media").collection("Reviews").findOne({ _id: new ObjectId(rid)})
        if(cinfo.username == req.session.user.username) {
            await client.db("Review_Media").collection("Reviews").deleteOne({ _id: new ObjectId(rid)})
            res.redirect(`/list/${req.session.user.username}`)
        } else {
            res.redirect('/home')
        }
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

app.get('/user/:name', async (req, res) => {
    let x = req.session.user;
	if(x == undefined) {
		res.redirect('/home')
	}
	else {
        const usern = req.params["name"];
        const info = await client.db("Review_Media").collection("Users").findOne({ username: usern.toLowerCase()})
        let ifuser = false;
        if(info.username == req.session.user.username) {
            ifuser = true;
        }
		res.render('user', {
			userinfo: info,
            ifu: ifuser,
		})
	}
})

app.post('/userform', upload.single("pfp"), async (req, res) => {

    let pass = true;
    if(req.file == undefined) {
        pass = false;
    }
    if(pass == true) {

        const bufferi = fs.readFileSync(req.file.path)
        let i = bufferi.toString('base64')
        let i2 = `data:${req.file.mimetype};base64,${i}`

        let ch = { username: req.session.user.username.toLowerCase()}
        let new_val = { $set: {imgpath: i2 }}
        await client.db("Review_Media").collection("Users").updateOne(ch, new_val)
        res.redirect(`/user/${req.session.user.username}`)
    } else {
        res.redirect(`/user/${req.session.user.username}`) 
    }
})

app.get('/review/:ind', async (req, res) => {
    let x = req.session.user

    if(x == undefined) {
        res.redirect('/home')
    } else {
        const ind = req.params['ind']
        const result = await client.db("Review_Media").collection("Reviews").findOne({ _id: new ObjectId(ind)})
        res.render('review_page', {
            review: result,
        })
    }
})

app.get('/add', async (req, res) => {
    let x = req.session.user

    if (x == undefined) {
        res.redirect('/home')
    } else {
        res.render('add_review', {
            user: x
        })
    }
})

app.post('/addform', upload.single('rimg'), async (req, res) => {

    let x = req.session.user;
    const adderrors = []
    let addin = true;
    let rtitle = String(req.body.reviewname)
    let rdescription = String(req.body.reviewdescription)
    let rrating = String(req.body.reviewrating)
    let rmedia = String(req.body.mediatype)
    console.log(rmedia)
    if(rmedia.length > 6) {
        addin = false;
        adderrors.push("Change Media Type.")
    }

    if(req.file == undefined) {
        addin = false;
        adderrors.push("Submit 1 image file.")
    }

    if(rtitle == "" || rdescription == "" || rrating == "") {
        adderrors.push("Don't leave a section blank.")
        addin = false;
    }

    if(addin == false) {
        res.render('add_review', {
            errors: adderrors,
            rname: rtitle,
            rdesc: rdescription,
            user: x
        })
    } else {

        const buffer1 = fs.readFileSync(req.file.path)
        let i1 = buffer1.toString('base64')
        let im1 = `data:${req.file.mimetype};base64,${i1}`

        let newi = {
            username: req.session.user.username,
            review_title: rtitle,
            review_description: rdescription,
            review_rating: rrating,
            review_type: rmedia,
            img1: im1,
        }
    
        await client.db("Review_Media").collection("Reviews").insertOne(newi);
        res.redirect(`/list/${req.session.user.username}`)
    }
})

app.all('*', async (req, res) => {
    res.sendStatus(404);
});


app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));