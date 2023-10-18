const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passwordHash = require("password-hash");
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter } = require('firebase-admin/firestore');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

const serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.set("view engine", "ejs");

app.use(session({
    secret: '3ab76a12b59f6021b0e771a4270772147d9ba5769ccb27c722fb2261ab61fb8f',
    resave: true,
    saveUninitialized: true
}));

app.get("/", (req, res) => {
    res.render('home2');
});

app.post("/signupsubmit", function(req, res) {
    // Your signup code here
    console.log(req.body);
    db.collection("vedic")
        .where(
            Filter.or(
                Filter.where("email", "==", req.body.email),
                Filter.where("user_name", "==", req.body.user_name)
            )
        )
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.send("Hey, this account already exists with the email and username.");
            } else {
                db.collection("vedic")
                    .add({
                        user_name: req.body.user_name,
                        email: req.body.email,
                        password: passwordHash.generate(req.body.password),
                    })
                    .then(() => {
                        res.redirect("/signin");
                    })
                    .catch(() => {
                        res.send("Something Went Wrong");
                    });
            }
        });
});

app.post("/signinsubmit", (req, res) => {
    // Your sign-in code here
    const email = req.body.email;
    const password = req.body.password;
    console.log(email);
    console.log(password);

    db.collection("vedic")
        .where("email", "==", email)
        .get()
        .then((docs) => {
            if (docs.empty) {
                res.send("User not found");
            } else {
                let verified = false;
                let user_name = "";
                docs.forEach((doc) => {
                    verified = passwordHash.verify(password, doc.data().password);
                    if (verified) {
                        user_name = doc.data().user_name;
                    }
                });
                if (verified) {
                    req.session.user_name = user_name;
                    res.redirect('/dashboard2');
                } else {
                    res.send("Authentication failed");
                }
            }
        })
        .catch((error) => {
            console.error("Error querying Firestore:", error);
            res.send("Something went wrong.");
        });
});

app.get("/dashboard2", (req, res) => {
    const user_name = req.session.user_name;
    if (user_name) {
        const testData = require('./test.json');
        res.render('dashboard2', { user_name, testData });
    } else {
        res.redirect('/signin');
    }
});

app.get("/signup", (req, res) => {
    res.render('signup');
});

app.get("/home2", (req, res) => {
    res.render('home2');
});

app.get("/signin", (req, res) => {
    res.render('signin');
});

app.get("/navigate", (req, res) => {
    res.render('navigate');
});
app.get("/navigate2", (req, res) => {
  res.render('navigate2');
});
app.get("/fitness", (req, res) => {
    res.render('fitness');
  });
  app.get("/stress", (req, res) => {
    res.render('stress');
  });
  app.get("/care", (req, res) => {
    res.render('care');
  });

app.listen(3005, () => {
    console.log("App listening on port 3005");
});
