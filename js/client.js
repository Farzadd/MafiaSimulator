var loaded  = false;
var myRole = "";

// Front-end logic
$("#tbGameID").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#btnJoinGameID").click();
    }
});

$("#btnJoinGameID").click(function() {
    gameID = $("#tbGameID").val();
    $('#txtGameID').text("Game ID: " + gameID);
    var response = executeCommand("joinServer");
    
    if (response == "FAIL")
    {
        $("#divSelectPlayer").html("<center>Unable to join game!</center>");
    } else {
        var tempString = "<div class=\"col-lg-12\"><center>";
        var players = response.split(",");
        jQuery.each( players, function( i, val ) {
            tempString += "<button class=\"btn btn-success selectPlayer\" type=\"button\" style=\"width: 150px; margin-bottom: 10px;\">" + val + "</button><br>";
        });
        tempString += "</center></div>";
        $("#divSelectPlayer").html(tempString);
        
        $(".selectPlayer").click(function() {
            userID = $(this).text();
            var response = executeCommand("confirmConnection");
            
            $("#playerName").text(userID);
            listen();
            
            $("#divSelectPlayer").hide();
            $("#divLoading").show();
        });
    }
    $("#divJoinGame").hide();
    $("#divSelectPlayer").show();
});

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

// Back-end logic
function processUpdate(arg)
{
    var alive = arg[0];
    var role = arg[1];
    var playersAlive = arg[2].split("~");
    
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
    jQuery.each( playersAlive, function( i, val ) {
        tempString += "<li>" + val + "</li>";
    });
    tempString += "</ol>";
    
    $( "#playerListClient" ).html(tempString);
    $( "#playersAliveCount" ).text(playersAlive.length);
    $( "#votesRequired" ).text( Math.ceil((playersAlive.length+1)/2) );
    
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
    
    var tempString = "";
    tempString = "<ol>";
    jQuery.each( targets, function( i, val ) {
        tempString += "<li>" + val + "</li>";
    });
    tempString += "</ol>";
    
    $( "#actionArea" ).html(tempString);
}