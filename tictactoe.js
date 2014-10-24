module.exports = function(ids, bridge, room, store){
      /*var s1 = nsp.connected[sockArr[0]], s2 = nsp.connected[sockArr[1]];*/
    ids.forEach(function(e){
        var s = bridge.connected[e];
        s.on("turnover", function(data) {
            var player = data.player;
            s.emit("toClient", {message:"wait"});
            s.broadcast.emit("toClient",{message: "boardChange", board: data.board});
            var winPointer = determineWin(data.board);
            if(winPointer > 0 && winPointer <= 2){
                // EMIT GAME OVER AND WIN EVENT
            }
            else if(winPointer < 0){
                // EMIT DRAW EVENT
            }
            else ((player > 1) ? enablePlayer(1, bridge, ids) : enablePlayer(2, bridge, ids));
        });
    });
    enablePlayer(1, bridge, ids);
};
var determineWin = function(board){
    if(board.indexOf(0) < 0)
        return -1;
    var winParty = 0;
    // HORIZONTALS
    var hslices = [];
    for(var i = 0; i <= 2; i++)
        hslices.push(board.slice((3 * i), ( (3 * i) + 3)));
    hslices.forEach(function(s){
        var hwin = s.every(function(e){
            return e === s[0];
        }.bind(s));
        if(hwin) winParty = s[0];
    });
    //VERTICALS
    for(var j = 0; j <= 2; j++){
        if((board[j] === board[j + 3]) && (board[j] === board[j + 6]))
            winParty = board[j];
    }
    // DIAGONALS
    if((board[0] === board[4]) && (board[0] === board[8]))
        winParty = board[0];
    if((board[2] === board[4]) && (board[2] === board[6]))
        winParty = board[2];
    return winParty;
}
var enablePlayer = function(playerNum, bridge, ids){
    bridge.connected[ids[playerNum - 1]].emit("toClient", {message: "turnStart"});
}