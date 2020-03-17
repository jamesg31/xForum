const User = require('../models/user');

module.exports = (req, res, next) => {
    User.findById(req.session.user._id).then(user => {
        if (!user.emailVerified) {
            req.flash('error', 'Please verify your email to be able to post content.');
            console.log('true');
        }
        next();
    }).catch(err => {
        console.log(err);
    });
};