var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');

app.use(session({
    cookie: {
        maxAge: 60000
    },
    store: new session.MemoryStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}))
app.use(flash());


var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'phpmysami',
    database: 'quotes'
});



connection.connect(function (err) {
    if (err) throw err
    console.log('You are now connected with mysql database...')
})

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));


var server = app.listen(3000, "127.0.0.1", function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});




app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');

app.get('/', function (req, rep) {
    rep.render('add');

})

var obj = {};
app.get('/quotes', function (req, rep) {
    connection.query('SELECT c.* , a.nom FROM citation c JOIN auteur a ON c.id_auteur = a.id', function (err, result) {
        if (err) {
            throw err;
        } else {
            obj = {
                quotes: result
            };
            rep.render('quotes', obj);
        }
    });
})


app.get('/quotes/(:id)', function (req, rep, next) {

    let id = req.params.id;

    connection.query('SELECT * FROM citation WHERE id = ' + id, function (err, rows, fields) {
        if (err) throw err

        if (rows.length <= 0) {
            req.flash('error', err)
            rep.redirect('/quotes')
        }
        else {
            rep.render('quote', {
                text: rows[0].text,
                source: rows[0].source,
                id_auteur: rows[0].id_auteur
            })
        }
    })
})




app.post('/', function (req, res, next) {
    let id = null;
    let text = req.body.citation;
    let auteur = req.body.auteur;
    let source = req.body.source;
    let errors = false;

    if (text.length === 0 || auteur.length === 0 || source.length === 0) {
        errors = true;

        req.flash('error', "Please enter citation , auteur and source");
        res.render('add');

      
    }

    if (!errors) {

        
        var form_auteur={
            id : id,
            nom: auteur
        }

        connection.query('INSERT INTO auteur SET ?', form_auteur, function (err, result) {
            if (err) {
                req.flash('error', err)

            } else {

                var form_data = {
                    id: id,
                    text: text,
                    source: source,
                    id_auteur: result.insertId
                }
                connection.query('INSERT INTO citation SET ?', form_data, function (err, result) {
                    if (err) {
                        req.flash('error', err)
                    } else {
                        req.flash('success', 'Book successfully added');
                        res.redirect('/quotes');
                    }
                })
            }
        })


    }
})


app.get('/update', function (req, rep, next) {
    rep.render('update',);
})

app.post('/update', function (req, res, next) {
    let id = req.body.id;
    let text = req.body.citation;
    let auteur = req.body.auteur;
    let source = req.body.source;
    let errors = false;

    console.log(req.params.id)
    if (id.length === 0 ||text.length === 0 || auteur.length === 0 || source.length === 0) {
        errors = true;
        
        req.flash('error', "Please enter citation , auteur and source");
        res.render('update');
    }

    if (!errors) {
        var form_data = {
            id: id,
            text: text,
            source: source
        }

        connection.query('UPDATE citation SET ? WHERE id = ' + id, form_data, function (err, result) {
            if (err) {
                req.flash('error', err)           
                } else {
                req.flash('success', 'Book successfully updated');
                res.redirect('/quotes');
            }
        })
    }
})





app.get('/delete/(:id)', function (req, res, next) {
    let id = req.params.id;
    connection.query('DELETE FROM citation WHERE id = ' + id, function (err, result) {
        if (err) {
            req.flash('error', err)
            res.redirect('/quotes')
        } else {
            req.flash('success', 'Book successfully deleted! ID = ' + id)
            res.redirect('/quotes')
        }
    })
})










app.listen(3000, function () {
    console.log('our server is live on port 3000');
})