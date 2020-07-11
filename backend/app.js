const http = require('http');
const express = require("express");  
const app = express();  
const mysql = require('mysql');
const param = {
    host     : 'localhost',
    user     : 'root',
    password : '12345678',
    port     : 3306,
    charset  : 'utf8mb4'
};
 
app.use(express.static(__dirname + "/public"))

app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/index.html");
})

app.get("/nodes", function(req, res){
    console.log(req.url);
    let sql = "SELECT a.*, b.controller, b.stash, b.is_tee, b.tee_score, b.is_gatekeeper, b.gatekeeper_eras, b.node_eras FROM kanban.node a"
    sql += " left join kanban.gatekeeper b on a.node_name = b.node_name";

    const connection = mysql.createConnection(param);
    connection.query(sql, function (error, results) {
        if (error) {
            console.log(error);
            o = {'status':'error'};
            res.send(JSON.stringify(o));

            return;
        };
        
        o = {'status':'ok', 'result':results};
        console.log(JSON.stringify(o));
        res.send(JSON.stringify(o));
    })
    connection.end();
})

var httpServer = http.createServer(app);
httpServer.listen(8080)

