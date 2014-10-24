var builder = function(){
    var app = {};
    app.socket = io("/bridge");
    app.boardDefault = [0,0,0,0,0,0,0,0,0];
    app.BoardModel = Backbone.Model.extend({
        defaults: function(){
            return{
                board: app.boardDefault,
                allDisabled: false,
                prevWin: 0,
                gameOver: false,
                myScore: 0,
                oScore: 0,
                playerSet: 1
            }
        },
        setSlot: function(slot, ct){
            this.get("board")[slot] = ct;
            this.trigger("custom:change:board", slot, ct);
        }
    });
    app.Board = new app.BoardModel;
    app.BoardView = Backbone.View.extend({
        el: $("#ttt-board"),
        initialize: function(){
			this.listenTo(app.Board, "change custom:change:board", this.renderBoard);
			this.listenTo(app.Board, "change:allDisabled", this.renderBoard);
			app.socket.on("toClient",function(data){
			    switch(data.message){
			        case "hello":
			            break;
			        case "turnStart":
			        	this.startTurn();
			        	break;
			        case "playerSet":
			        	app.Board.set("playerSet", data.playerSet);
			        	break;
			        case "lastWinSet":
			        	this.setLastWin(data.win);
			        	break;
			        case "resetBoard":
			        	app.Board.set("board", app.boardDefault);
			        	break;
			        case "boardChange":
			        	app.Board.set("board", data.board);
			        	break;
			        case "wait":
			            this.waitForPlayer();
			            break;
			    }
			}.bind(this));
			app.socket.emit("join", {room: window.location.pathname.split("/game/")[1]});
		},
		events:{
			"click .ttt-button": "slotClicked"
		},
		renderBoard: function(){
		   this.$el.empty();
		   var b = app.Board.get("board");
		   for(var i = 0; i < b.length; i++){
		       var vm = {
		           marker: b[i],
		           slotNum: i,
		           allDisabled: app.Board.get("allDisabled")
		       }
		       var v =  _.template($("#itemTpl").html())(vm);
		       this.$el.append(v);
		   }
		},
		startTurn: function(){
			app.Board.set("allDisabled", false);
			alert("your turn");
		},
		waitForPlayer:function(){
		    app.Board.set("allDisabled", true);
		},
		slotClicked: function(event){
            event.preventDefault();
            if(event.currentTarget.className.indexOf("disabled") < 0){
                Back.Board.setSlot(parseInt(event.currentTarget.id), 
                	app.Board.get("playerSet"));
                app.socket.emit("turnover",{board: app.Board.get("board"), 
                	player: app.Board.get("playerSet")});
            }
		},
		setLastWin: function(player){
			app.Board.set("prevWin", player);
			if(app.Board.get("playerSet") === player){
				alert("You won");
			}else{
				alert("You lost");
			}
		}
    });
    app.AppView = new app.BoardView;
    return app;
};
var Back = builder();
Back.Board.setSlot(0,0);