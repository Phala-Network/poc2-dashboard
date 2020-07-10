const http = require('http');
const express = require("express");  
const app = express();  
const mysql = require('mysql');
const param = {
    host     : 'localhost',
    user     : 'root',
    password : '12345678',
    port     : 3306
};
 
app.use(express.static(__dirname + "/public"))

app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/index.html");
})

app.get("/nodes", function(req, res){
    let sql = "select * from kanban.node";

    var connection = mysql.createConnection(param)
    connection.query(sql, function (error, results) {
        if (error) {
            console.log(error);
            o = {'status':'error'};
            res.send(JSON.stringify(o));

            return;
        };
        
        o = {'status':'ok', 'result':results};
        res.send(JSON.stringify(o));
    })
    connection.end();
})

var httpServer = http.createServer(app);
httpServer.listen(8080)

