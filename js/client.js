var loaded  = false;
var myRole = "";
var noActionMessage = "<center>No action to perform at this time.<br><button id=\"btnRefresh\" class=\"btn btn-xs btn-success\" onClick=\"refreshListen();\">Refresh</button></center>";

// Front-end logic
$("#tbGameID").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#btnJoinGameID").click();
    }
});

$("#tbDeathMessage").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#btnSubmitDeathMessage").click();
    }
});

$("#btnJoinGameID").click(function() {
    gameID = $("#tbGameID").val();
    executeCommand("joinServer", "", "", joinGame_post, 0);
    $("#btnJoinGameID").prop("disabled", true);
});

function joinGame_post(response)
{
    if (response == "FAIL")
    {
        $("#divSelectPlayer").html("<center>Unable to join game!</center>");
    } else {
        $('#txtGameID').text("Game ID: " + gameID);
        
        var tempString = "<div class=\"col-lg-12\"><center>";
        var players = response.split(",");
        jQuery.each( players, function( i, val ) {
            tempString += "<button class=\"btn btn-success selectPlayer\" type=\"button\" style=\"width: 150px; margin-bottom: 10px;\">" + val + "</button><br>";
        });
        tempString += "</center></div>";
        $("#divSelectPlayer").html(tempString);
        
        $(".selectPlayer").click(function() {
            userID = $(this).text();
            executeCommand("confirmConnection", "", "", null, 0);
            
            $("#playerName").text(userID);
            listen();
            
            $("#divSelectPlayer").hide();
            $("#divLoading").show();
        });
    }
    $("#divJoinGame").hide();
    $("#divSelectPlayer").show();
}

$("#showRole").click(function() {
    if ( $("#playerRole").text() == "HIDDEN" )
    {
        $("#playerRole").text(myRole);
        $("#showRole").text("[HIDE]");
    }
    else
    {
        $("#playerRole").text("HIDDEN");
        $("#showRole").text("[SHOW]");
    }
});

$("#btnSubmitDeathMessage").click(function () {
    $("#tbDeathMessage").hide();
    $("#btnSubmitDeathMessage").hide();
    
    executeCommand("setDeathMessage", "", $("#tbDeathMessage").val(), null, 0);
});

// Back-end logic
function processUpdate(arg)
{
    var alive = arg[0];
    var role = arg[1];
    var alivePlayers = arg[2].split("~");
    var deadPlayers = arg[3].split("~");
    
    if (alive)
    {
        $("#playerStatus").text("ALIVE");
        $("#playerStatus").css('color', 'green'); 
    } else {
        $("#playerStatus").text("DEAD");
        $("#playerStatus").css('color', 'red'); 
    }
    
    myRole = role;
    
    var tempString = "";
    tempString = "<ol>";
    jQuery.each( alivePlayers, function( i, val ) {
        if (val != "")
            tempString += "<li>" + val + "</li>";
    });
    jQuery.each( deadPlayers, function( i, val ) {
        if (val != "")
            tempString += "<li><strike>" + val + "</strike></li>";
    });
    tempString += "</ol>";
    
    $( "#playerListClient" ).html(tempString);
    $( "#playersAliveCount" ).text(alivePlayers.length + " Alive");
    $( "#votesRequired" ).text( Math.ceil((alivePlayers.length+1)/2) );
    $( "#actionArea" ).html(noActionMessage);
    
    if (!loaded)
    {
        $("#divLoading").hide();
        $("#divPlayerInfo").show();
        
        loaded = true;
    }
}

function clientChooseTarget(arg)
{   
    var targets = arg.split("~");
    
    var tempString = "<center>";
    jQuery.each( targets, function( i, val ) {
        tempString += "<button class=\"btn btn-danger chooseTarget\" type=\"button\" style=\"width: 150px; margin-bottom: 10px;\">" + val + "</button><br>";
    });
    tempString += "</center>";
    
    $( "#actionArea" ).html(tempString);
    
    $(".chooseTarget").click(function() {
        var targetID = $(this).text();
        executeCommand("chosenTarget", targetID, "", null, 0);
        
        $("#actionArea").html(noActionMessage);
    });
}

function clientInfoAndConfirm(arg)
{
    var tempString = "<center>" + arg + "<br><br><button class=\"btn btn-danger\" id=\"confirmInfo\" type=\"button\" style=\"width: 150px; margin-bottom: 10px;\">Got it!</button></center>";
    
    $( "#actionArea" ).html(tempString);
    
    $("#confirmInfo").click(function() {
        executeCommand("infoConfirmed", "", "", null, 0);
        
        $("#actionArea").html(noActionMessage);
    });
}

function clientGameOver(arg)
{
    $('#victoryModalLabel').text(arg + " Victory!");
    $('#victoryModal').modal('show');
}

function receiveGameInfo(info)
{
    $('#gameRules').html(info);
}