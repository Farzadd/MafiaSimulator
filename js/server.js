var playerNames = [];
var playerRoles = [];
var playerAlive = [];
var playerConnected = [];

var roleCount = 0;
var gameStarted = false;

var youtubePlayer;
var playerOrgVolume;

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
            
            if (!elem.is(":checkbox") || elem.prop("checked"))
                roleCount += parseInt(elem.val());
        }
    });
    
    updateGameState();
});

$("#btnLoadSong").click(function() {
    $("#youtubePlayer").show();
    if (youtubePlayer) {
        youtubePlayer.loadVideoById($("#tbSongID").val());
        setTimeout(function(){ youtubePlayer.pauseVideo(); }, 300);
    }
});

$("#btnStartGame").click(function() {
    startGame();
});

$("#btnStartNight").click(function() {
    beginNight();
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
        tempString += "<li><span id=\"pnl_" + val + "\">" + val + "</span><span style=\"float: right;\"><a href=\"#\" class=\"pLynch\" data-id=\"" + i + "\">[LYNCH]</a> [<span id=\"pStatus" + i + "\">PRE-GAME</span>] [<a id=\"pRole" + i + "\" data-toggle=\"tooltip\" data-placement=\"right\" title=\"Unassigned\">ROLE</a>]</span></li>";
    });
    tempString += "</ol>";
    
    $( "#playerList" ).html(tempString);
    $('[data-toggle="tooltip"]').tooltip();
    
    $(".pLynch").click(function() {
        if (gameStarted)
            changePlayerStatus($(this).attr("data-id"), false);
        else
            alert("Can not lynch yet, the game has not started!");
    });
    
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
        alert("Must have at least 1 player... You may need to get some friends...");
    }
    else
    {
        $("#tbPlayerName").hide();
        $("#btnAddPlayer").hide();
        $("#btnStartGame").hide();
        $("#divLiveGame").show();
        $("#btnStartNight").show();
        
        assignRoles();
        
        $('#roleForm').find('input').each(function(){
            var elem = $(this);
            elem.prop("disabled",true);
        });
        
        $('#roleForm').find('label').each(function(){
            var elem = $(this);
            elem.addClass('disabled').off();
        });
        
        $('#roleForm').find('.btn-group').each(function(){
            var elem = $(this);
            elem.prop("disabled",true);
        });
        
        userID = Math.floor((Math.random() * 9999) + 1000);
        gameID = executeCommand("createSession", playerNames.join(","), "");
        $('#txtGameID').text("Game ID: " + gameID);
        
        listen();
        gameStarted = true;
        
        logEvent("Game Started with ID: " + gameID + "!");
        speakText("The game has started");
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
            if (!elem.is(":checkbox") || elem.prop("checked"))
            {
                for (i = 0; i < elem.val(); i++) {
                    var rand = Math.floor((Math.random() * tobeAssigned.length));
                    logEvent("Assigning the role '" + elem.attr("id").replace("num", "") + "' to " + tobeAssigned[rand] + " via rand: " + rand);
                    
                    var playerId = $.inArray(tobeAssigned[rand], playerNames);
                    playerRoles[playerId] = elem.attr("id").replace("num", "");
                    
                    changePlayerStatus(playerId, true);
                    
                    $('#pRole' + playerId).attr("title", playerRoles[playerId]);
                    $('#pRole' + playerId).attr("data-original-title", playerRoles[playerId]);
                    $('[data-toggle="tooltip"]').tooltip();
                    
                    tobeAssigned.splice( rand, 1 );
                }
            }
        }
    });
}

function changePlayerStatus(id, status)
{
    playerAlive[id] = status;
    if (status)
    {
        $('#pStatus' + id).text("ALIVE");
        $('#pStatus' + id).css('color', 'green');
        $('.pLynch[data-id=' + id + "]").show();
    }
    else
    {
        $('#pStatus' + id).text("DEAD");
        $('#pStatus' + id).css('color', 'red');
        $('.pLynch[data-id=' + id + "]").hide();
    }
}

function getPlayerID(name)
{
    return playerNames.indexOf(name);
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
    
    if (youtubePlayer) {
        audioElement.addEventListener("play", function() {
            playerOrgVolume = youtubePlayer.getVolume();
            youtubePlayer.setVolume(Math.round(playerOrgVolume * 0.15));
        });
        
        audioElement.addEventListener("ended", function() {
            youtubePlayer.setVolume(playerOrgVolume);
        });
    }
}

function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtubePlayer', {
      height: '90',
      width: '100%',
      events: {
      }
    });
}

// Night-logic
function beginNight()
{
    if (youtubePlayer) youtubePlayer.playVideo();
    speakText("It is now night. All players close your eyes.");
    setTimeout(function(){ wakeMafia(); }, 10000);
    
    $("#btnStartNight").prop('disabled', true);
}

function separateRole(role)
{
    playersWithRole = [];
    playersWithoutRole = [];
    
    for (i = 0; i < playerNames.length; i++) {
        if (playerRoles[i] == role)
            playersWithRole.push(playerNames[i]);
        else
            playersWithoutRole.push(playerNames[i]);
    }
    
    return [playersWithRole, playersWithoutRole];
}

function wakeMafia()
{
    setTimeout(function(){ wakeAll(); }, 10000);
    
    var separatedPlayers = separateRole("Mafia");
    for (i = 0; i < separatedPlayers[0].length; i++) {
        executeCommand("chooseTarget", separatedPlayers[0][i], separatedPlayers[1].join("~"));
    }
    
    speakText("Mafia. Open your eyes and choose your target.");
}

function wakeAll()
{
    if (youtubePlayer) youtubePlayer.pauseVideo();
    
    speakText("The night is over. Everyone wake up.");
    
    $("#btnStartNight").prop('disabled', false);
}