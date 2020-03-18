const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql');
const csrf = require('csurf');
const flash = require('connect-flash');

const config = require('./config');

const app = express();
app.set('view engine', 'ejs');

const csrfProtection = csrf();

global.db = mysql.createConnection({
    host: config.MYSQL_HOST,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASS,
    database: config.MYSQL_DB
});

var sessionStore = new MySQLStore({}/* session store options */, db);

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    let error = req.flash('error');
    if (error.length > 0) {
        error = error[0];
    } else {
        error = null;
    }
    let notification = req.flash('notification');
    if (notification.length > 0) {
        notification = notification[0];
    } else {
        notification = null;
    }

    res.locals.notification = notification;
    res.locals.error = error;
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

const mainRoutes = require('./routes/main');
const forumRoutes = require('./routes/forum');
const authRoutes = require('./routes/auth');
app.use(mainRoutes);
app.use(forumRoutes);
app.use(authRoutes);

db.connect((err) => {
    if (err) throw err;
    app.listen(80);
}) 
