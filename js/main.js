var userID = "";
var gameID = "";
var listenTimer = -1;

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

function executeCommand(command, arg1, arg2, callback, attempt) {
    var session = gameID;
    if (session == "")
        session = "none";
    
    var ajaxR = $.ajax({
        type: "GET",
        url: "server.php?id=" + userID + "&session=" + session + "&cmd=" + command + "&arg1=" + arg1 + "&arg2=" + arg2,
        async: true
    }).fail(function() {
        if (attempt < 5)
            executeCommand(command, arg1, arg2, callback, attempt+1);
    });
    
    if (callback != null)
    {
        ajaxR.done(callback);
    }
}

function listen()
{
    listenTimer = setInterval(
      function() 
      {
        executeCommand("pullMessages", gameID, "", listen_post, 0);
        
      }, 4000);
}

function listen_post(results)
{
    var commands = $.parseJSON(results);
        
    if (commands != "")
    {
        $.each( commands, function( key, value ) {
            handleCommand(value["issuer"], value["message"], value["arg"]);
        });
    }
}

function refreshListen()
{
    if (listenTimer != -1)
        clearTimeout(listenTimer);
    
    $("#btnRefresh").prop("disabled", true);
    
    setTimeout( function() {
        $("#btnRefresh").prop("disabled", false);
    }, 2000 );
    
    listen();
}

function handleCommand(issuer, command, arg)
{
    if (command == "confirmConnection")
    {
        processConnection(issuer);
    }
    else if (command == "updateFromServer")
    {
        processUpdate(JSON.parse(arg));
    }
    else if (command == "chooseTarget")
    {
        clientChooseTarget(arg);
    }
    else if (command == "chosenTarget")
    {
        chosenTarget(issuer, arg);
    }
    else if (command == "infoAndConfirm")
    {
        clientInfoAndConfirm(arg);
    }
    else if (command == "infoConfirmed")
    {
        infoConfirmed(issuer);
    }
    else if (command == "gameOver")
    {
        clientGameOver(arg);
    }
    else if (command == "setDeathMessage")
    {
        saveDeathMessage(issuer, arg);
    }
    else if (command == "updateGameRules")
    {
        receiveGameInfo(arg);
    }
}