var playerNames = [];
var playerRoles = [];
var playerConnected = [];

var roleCount = 0;

var youtubePlayer;

// Front-end logic
$("#tbPlayerName").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#btnAddPlayer").click();
    }
});

$("#tbSongID").keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        $("#btnLoadSong").click();
    }
});

$("#btnAddPlayer").click(function() {
    addPlayer($("#tbPlayerName").val());
});

$("#roleForm").change(function() {
    roleCount = 0;

    $('#roleForm').find('input').each(function(){
        var elem = $(this);
        if ($.isNumeric(elem.val()) && elem.attr('id') != "numVillageIdiot")
        {
            if (elem.val() < 0)
            {
                elem.val("0");
            }
            
            roleCount += parseInt(elem.val());
        }
    });
    
    updateGameState();
});

$("#btnLoadSong").click(function() {
    $("#youtubePlayer").attr("src", "http://www.youtube.com/embed/" + $("#tbSongID").val() + "?rel=0&enablejsapi=1&modestbranding=1&showinfo=0");
    youtubePlayer = new YT.Player('youtubePlayer');
});

$("#btnStartGame").click(function() {
    startGame();
});

// Back-end logic
function addPlayer(name)
{
    if (name == "")
    {
        alert("Must provide name");
    }
    else if ( $.inArray(name, playerNames) !== -1 )
    {
        alert("Player already exists");
    }
    else
    {
        playerNames.push( name );
        $("#tbPlayerName").val("");
        reloadPlayerList();
    }
}

function reloadPlayerList()
{
    var tempString = "";
    tempString = "<ol>";
    jQuery.each( playerNames, function( i, val ) {
        tempString += "<li><span id=\"pnl_" + val + "\">" + val + "</span><span style=\"float: right;\">[<a id=\"pStatus" + i + "\" data-toggle=\"tooltip\" data-placement=\"left\" title=\"Pre-game\">STATUS</a>] [<a id=\"pRole" + i + "\" data-toggle=\"tooltip\" data-placement=\"right\" title=\"Unassigned\">ROLE</a>]</span></li>";
    });
    tempString += "</ol>";
    
    $( "#playerList" ).html(tempString);
    $('[data-toggle="tooltip"]').tooltip();
    
    updateGameState();
}

function updateGameState()
{
    if (playerNames.length - roleCount < 0)
        $("#btnStartGame").prop("disabled",true);
    else
        $("#btnStartGame").prop("disabled",false);
    
    $( "#numVillageIdiot" ).val(playerNames.length - roleCount);
    $( "#playerCount" ).html(playerNames.length + " players");
    $( "#roleCount" ).html(roleCount + " roles");
}

function startGame()
{
    if (playerNames.length == 0)
    {
        alert("Must have atleast 1 player... You may need to get some friends...");
    }
    else
    {
        $("#tbPlayerName").hide();
        $("#btnAddPlayer").hide();
        $("#btnStartGame").hide();
        $("#divLiveGame").show();
        
        assignRoles();
        
        $('#roleForm').find('input').each(function(){
            var elem = $(this);
            elem.prop("disabled",true);
        });
        
        userID = Math.floor((Math.random() * 9999) + 1000);
        gameID = executeCommand("createSession", playerNames.join(","), "");
        $('#txtGameID').text("Game ID: " + gameID);
        
        listen();
        
        logEvent("Game Started with ID: " + gameID + "!");
        speakText("The game has started");
        
        if (youtubePlayer) youtubePlayer.playVideo();
    }
}

function assignRoles()
{
    var tobeAssigned = playerNames.slice();
    playerRoles = new Array(playerNames.length);
    
    $('#roleForm').find('input').each(function(){
        var elem = $(this);
        if ($.isNumeric(elem.val()))
        {
            for (i = 0; i < elem.val(); i++) {
                var rand = Math.floor((Math.random() * tobeAssigned.length));
                logEvent("Assigning the role '" + elem.attr("id").replace("num", "") + "' to " + tobeAssigned[rand] + " via rand: " + rand);
                
                var playerId = $.inArray(tobeAssigned[rand], playerNames);
                playerRoles[playerId] = elem.attr("id").replace("num", "");
                
                $('#pRole' + playerId).attr("title", playerRoles[playerId]);
                $('#pRole' + playerId).attr("data-original-title", playerRoles[playerId]);
                $('#pStatus' + playerId).attr("title", "Alive");
                $('#pStatus' + playerId).attr("data-original-title", "Alive");
                $('[data-toggle="tooltip"]').tooltip();
                
                tobeAssigned.splice( rand, 1 );
            }
        }
    });
}

function logEvent(text)
{
    var tempString = "";
    var now = new Date();
    tempString = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " - " + text + "<br>";
    
    $( "#gameLog" ).append(tempString);
}

function speakText(text)
{
    var key = "38ade4347d4f4724a5746f3e515ef423";
    var audioElement = document.createElement('audio');
    audioElement.setAttribute('src', "http://api.voicerss.org/?key=" + key + "&hl=en-Ca&f=48khz_16bit_stereo&src=" + text);
    audioElement.setAttribute('autoplay', 'autoplay');
    $.get();
    audioElement.addEventListener("load", function() {
        if (youtubePlayer) youtubePlayer.pauseVideo();
        audioElement.play();
        
        if (youtubePlayer) {
            setTimeout(
              function() 
              {
                youtubePlayer.playVideo();
              }, 4000);
        }
    }, true);
}