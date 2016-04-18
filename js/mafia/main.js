var userID = "";
var gameID = "";

if (window.addEventListener) window.addEventListener("load", autorun, false);
else if (window.attachEvent) window.attachEvent("onload", autorun);
else window.onload = autorun;

// Front-end logic
$("#btnCreateGame").click(function() {
    $("#divNewGame").hide();
    $("#divCreateGame").show();
});

$("#btnJoinGame").click(function() {
    $("#divNewGame").hide();
    $("#divJoinGame").show();
});

// Back-end logic
function autorun()
{
}

function executeCommand(command, arg1, arg2) {
    var session = gameID;
    if (session == "")
        session = "none";
    
    return $.ajax({
        type: "GET",
        url: "server.php?id=" + userID + "&session=" + session + "&cmd=" + command + "&arg1=" + arg1 + "&arg2=" + arg2,
        async: false
    }).responseText;
}

function listen()
{
    setTimeout(
      function() 
      {
        var commands_j = executeCommand("pullMessages", gameID, "");
        var commands = $.parseJSON(commands_j);
        
        if (commands != "")
        {
            $.each( commands, function( key, value ) {
                handleCommand(value["issuer"], value["message"]);
            });
        }
        
        listen();
      }, 2000);
}

function handleCommand(issuer, command)
{
    if (command == "confirmConnection")
    {
        $("#pnl_" + issuer).html("<b>" + $("#pnl_" + issuer).html() + "</b>");
                    
        logEvent(issuer + " has connected!");
    }
}