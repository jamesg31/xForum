exports.getForum = (req, res, next) => {
    const url = req.params.url;

    db.query('SELECT * FROM forums WHERE url = ?', [url], (err, forum) => {
        if (forum.length == 0) {
            res.flash('error', 'This forum does not exist.');
            res.redirect('/');
        }
        db.query('SELECT * FROM posts WHERE forum_id = ?', [forum[0].forum_id], (err, posts) => {
            res.render('forum/forum', {
                path: '/forum',
                pageTitle: forum[0].title,
                data: posts,
                forum: forum[0]
            });
        });
    });
};