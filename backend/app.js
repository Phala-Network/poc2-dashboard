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
    let column_clause = "a.*, b.id as b_id, b.controller as b_controller, b.node_name as b_node_name, b.stash, b.is_gatekeeper, b.is_tee, b.slash_eras, b.gatekeeper_eras";
    let sql = "SELECT " + column_clause + " FROM kanban.node a";
    sql += " LEFT JOIN kanban.gatekeeper b ON a.controller = b.controller";
    sql += " UNION";
    sql += " SELECT " + column_clause + " FROM kanban.node a";
    sql += " RIGHT JOIN kanban.gatekeeper b ON a.controller = b.controller";
    sql += " WHERE a.controller IS NULL";
    
    const connection = mysql.createConnection(param);
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
httpServer.listen(8081)

