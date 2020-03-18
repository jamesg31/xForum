const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');

const config = require('../config');

const transporter = nodemailer.createTransport(sendgrid({
    auth: {
        api_key: config.SENDGRID_KEY
    }
}));

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login'
    });
};

exports.postLogin = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const stayLoggedIn = req.body.stayloggedin;
    
    db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, user) => {
        if (user.length == 0) {
            req.flash('error', 'Invalid Username or Email');
            return res.redirect('/login');
        }
        bcrypt.compare(password, user[0].password).then(doMatch => {
            if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user[0];
                return req.session.save(result => {
                    res.redirect('/');
                });
            }
            req.flash('error', 'Invalid Password');
            res.redirect('/login');
        }).catch(err => {
            console.log(err);
            res.redirect('/login');
        });
    });
};

exports.getRegister = (req, res, next) => {
    res.render('auth/register', {
        path: '/register',
        pageTitle: 'Register'
    });
};

exports.postRegister = (req, res, next) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, userDoc) => {
        console.log(userDoc);
        if (userDoc.length != 0) {
            console.log('similar');
            req.flash('error', 'Email or Username Already in Use');
            return res.redirect('/register');
        }
        crypto.randomBytes(32, (err, buffer) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            }
            const token = buffer.toString('hex');
            return bcrypt.hash(password, 12).then(hashedPassword => {
                db.query('INSERT INTO users (username, email, password, email_verified, verify_token) VALUES (?, ?, ?, false, ?)', [username, email, hashedPassword, token], (err, result) => {
                    if (err) throw err;
                    console.log('Inserted!')
                });
                return;
            }).then(() => {
                req.flash('notification', 'Please check your email to verify your account and to be able to post.');
                res.redirect('/login');
                return transporter.sendMail({
                    to: email,
                    from: 'donotreply@jamesg31.com',
                    subject: 'Verify Your Account',
                    html: `<p>Thank you for signing up! Please verify your account by clicking <a href="http://localhost/verify/${token}">here</a>.</p>`
                });
            });
        });
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password'
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        db.query('SELECT * FROM users WHERE username = ? OR email = ?', [req.body.username, req.body.username], (err, user) => {
            if (user.length == 0) {
                req.flash('error', 'No Account With That Email / Username Found');
                res.redirect('/reset');
            }
            db.query('UPDATE users SET reset_token = ?, reset_expiration = ? WHERE user_id = ?', [token, Date.now() + 3600000, user[0].user_id], (err) => {
                req.flash('Notification', 'Please check email for reset instructions.')
            })
            res.redirect('/login');
            transporter.sendMail({
                to: user[0].email,
                from: 'donotreply@jamesg31.com',
                subject: 'Password Reset',
                html: `
                <p>Someone requested a password reset for your account. If this was not you please disregard this email.</p>
                <p>Click this <a href="http://localhost/reset/${token}">link</a> to set a new password. This link will only be valid for 24 hours</p>
                `
            });
        })
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    db.query('SELECT * FROM users WHERE reset_token = ? AND reset_expiration > ?', [token, Date.now()], (err, user) => {
        if (user.length == 0) {
            res.redirect('/');
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'Set New Passord',
            user_id: user[0].user_id.toString(),
            passToken: token
        }); 
    });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const user_id = req.body.user_id;
    const token = req.body.token;
    var resetuser;

    db.query('SELECT * FROM users WHERE reset_token = ? AND reset_expiration > ? AND user_id = ?', [token, Date.now(), user_id], (err, user) => {
        resetuser = user;
        return bcrypt.hash(newPassword, 12).then(hashedPassword => {
            db.query('UPDATE users SET reset_token = null, reset_expiration = null, password = ? WHERE user_id = ?', [hashedPassword, user_id], err => {
                res.redirect('/login');
                transporter.sendMail({
                    to: resetuser[0].email,
                    from: 'donotreply@jamesg31.com',
                    subject: 'Password Reset Success',
                    html: '<p>Your password has been successfully reset. You can now login with your new password <a href="http://localhost/login">here</a>.</p>'
                });        
            })
        })
    });
};

exports.getVerify = (req, res, next) => {
    const token = req.params.token;
    db.query('SELECT * FROM users WHERE verify_token = ?', [token], (err, user) => {
        if (user.length == 0) {
            req.flash('error', 'Invalid Verification Link');
            req.redirect('/');
        }
        db.query('UPDATE users SET verify_token = null, email_verified = true WHERE user_id = ?', [user[0].user_id], err => {
            req.flash('notification', 'Email successfully verified.');
            res.redirect('/');
        });
    });
};