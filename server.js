//get socket with an id bridge.connected[x]
/***
REDIS
sudo service redis_6379 start
sudo service redis_6379 stop
***/
const express = require("express"), 
    socket = require("socket.io"), 
    http = require("http"),
    _redis = require("redis"),
    tictac = require("./tictactoe"),
    app = express(), 
    server = http.createServer(app),
    redis = _redis.createClient(),
    io = socket.listen(server),
    bridge = io.of("/bridge");

var sockArr = [];
var randomString = function (len, bits){
    bits = bits || 36;
    var outStr = "", newStr;
    while (outStr.length < len){
        newStr = Math.random().toString(bits).slice(2);
        outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
    }
    return outStr.toUpperCase();
};

//app.set("view engine", "jade");
//app.set("view engine","html");
app.set("view options", {layout: false});
app.use(express.static("static"));
app.use(express.static("bower_components"));
app.get("/", function(req, res){
    res.redirect("/game/test");
})
app.get("/game/:room", function(req, res){
    if(req.params.room){
        var redroom = req.params.room + "-players";
            redis.zcard(redroom, function(err, result2){
                if(err) res.send(502).end();
                if(result2 <= 1)
                    res.sendfile("./static/game.html");
                else
                    res.redirect("/bounce");
            });
    } else res.send(503);
});

app.get("/bounce", function(req, res){
    res.send("ROOM FULL").end();
});
bridge.on('connection', function(s){
    //console.log('someone connected');
    s.on("join",function(data){
        var room = data.room;
        var redroom = room + "-players";
        s.join(room);
        s.emit("toClient", {message: "wait"});
        redis.zcard(redroom, function(err, result) {
            if(err) throw err;
            if(result){
                redis.zadd(redroom, "2", s.id);
                s.emit("toClient", {message: "playerSet", playerSet: 2});
                console.log("STARTING A GAME");
                redis.zrangebyscore(redroom, "-inf","+inf", function(err, result){
                    if(err) throw err;
                    if(result) tictac(result, bridge, room, redis);
                });
            }
            else{
                redis.zadd(redroom, "1", s.id);
                s.emit("toClient", {message: "playerSet", playerSet: 1});
            }
        });
    });
    s.on("disconnect", function(){
        var room = s.rooms.pop();
        s.leave(room);
        s.broadcast.emit("toClient",{message: "playerLeft"});
        redis.pexpire(room+"-players", "50");
    }.bind(s));
});
server.listen(process.env.PORT, function() {
	console.log("Ready");
});