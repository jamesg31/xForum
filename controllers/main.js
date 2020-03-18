exports.getHome = (req, res, next) => {
    var data = {};
    var urls = {};

    db.query('SELECT * FROM categories', (err, catagories) => {
        if (err) throw err;
        db.query('SELECT * FROM forums', (err, forums) => {
            if (err) throw err;
            for (i=0; i < catagories.length; i++) {
                data[catagories[i].title] = {};
                urls[i] = [];
                    for (x=0; x < forums.length; x++) {
                        if (forums[x].catagory_id == catagories[i].catagory_id) {
                            data[catagories[i].title][forums[x].title] = forums[x].description;
                            urls[i].push(forums[x].url);
                        }
                    }
            }
            res.render('home', {
                path: '/',
                pageTitle: 'xForum',
                data: data,
                urls: urls
            });
        });
    });
};