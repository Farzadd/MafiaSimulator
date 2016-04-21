var playerNames = [];
var playerRoles = [];
var playerAlive = [];
var playerConnected = [];
var playerTargets = [];

var roleCount = 0;
var gameStarted = false;

var currentNight = 0;
var currentRole = "";

var youtubePlayer;
var playerOrgVolume;

var policeReference = -1;

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

$("#btnDebug").click(function() {
    addPlayer("Farzad");
    addPlayer("Kimia");
    addPlayer("Shayan");
    addPlayer("Mahsan");
    addPlayer("F13");
    addPlayer("Behy");
    addPlayer("Reza");
    addPlayer("Seps");
    addPlayer("Faraz");
    addPlayer("Amir");
    addPlayer("Sanam");
    
    $("#numMafia").val("1");
    $("#numMafiaPower").val("1");
    $("#numDetective").parent().click();
    $("#numMedic").parent().click();
    $("#numOracle").parent().click();
    
    $("#btnLoadSong").click();
    
    $("#btnDebug").prop("disabled", true);
    $("#btnDebug").hide();
    $("#roleForm").change();
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
        {
            changePlayerStatus($(this).attr("data-id"), false);
            
        } else
            alert("Can not lynch yet, the game has not started!");
    });
    
    updateGameState();
}

function updateGameState()
{
    if (playerNames.length - roleCount < 0 ||
        $("#numMafia").val() <= 0 ||
        $("#numMafiaPower").val() <= 0)
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
        
        $("#btnDebug").prop("disabled", true);
        $("#btnDebug").hide();
        
        assignRoles();
        
        disableForm("roleForm");
        disableForm("settingForm");
        
        userID = Math.floor((Math.random() * 9999) + 1000);
        gameID = executeCommand("createSession", playerNames.join(","), "");
        $('#txtGameID').text("Game ID: " + gameID);
        
        listen();
        gameStarted = true;
        
        logEvent("Game Started with ID: " + gameID + "!");
        speakText("The game has started");
    }
}

function disableForm(form)
{
    $('#' + form).find('input').each(function(){
        var elem = $(this);
        elem.prop("disabled",true);
    });
    
    $('#' + form).find('label').each(function(){
        var elem = $(this);
        elem.addClass('disabled').off();
    });
    
    $('#' + form).find('.btn-group').each(function(){
        var elem = $(this);
        elem.prop("disabled",true);
    });
}

function processConnection(player)
{
    var tID = getPlayerID(player);
    playerConnected[tID] = true;
    
    updateClient(tID);
    
    $("#pnl_" + player).html("<b>" + $("#pnl_" + player).html() + "</b>");
    logEvent(player + " has connected!");
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
    
    updateClient(i);
}

function updateClient(player)
{
    if (!playerConnected[player])
        return;
    
    alivePlayers = [];
    deadPlayers = [];
    
    for (i = 0; i < playerNames.length; i++) {
        if (playerAlive[i])
            alivePlayers.push(playerNames[i]);
        else
            deadPlayers.push(playerNames[i]);
    }
    
    var updateArr = [];
    updateArr[0] = playerAlive[player];
    updateArr[1] = playerRoles[player];
    updateArr[2] = alivePlayers.join("~");
    updateArr[3] = deadPlayers.join("~");
    executeCommand("updateClient", playerNames[player], JSON.stringify(updateArr));
}

function updateAllClients()
{   
    alivePlayers = [];
    deadPlayers = [];
    
    for (i = 0; i < playerNames.length; i++) {
        if (playerAlive[i])
            alivePlayers.push(playerNames[i]);
        else
            deadPlayers.push(playerNames[i]);
    }
    
    for (i = 0; i < playerNames.length; i++)
    {
        if (!playerConnected[i])
            continue;
        
        var updateArr = [];
        updateArr[0] = playerAlive[player];
        updateArr[1] = playerRoles[player];
        updateArr[2] = alivePlayers.join("~");
        updateArr[3] = deadPlayers.join("~");
        executeCommand("updateClient", playerNames[player], JSON.stringify(updateArr));
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
    var url = "http://api.voicerss.org/?key=" + key + "&hl=en-Ca&f=48khz_16bit_stereo&src=" + text;
    
    var context = new (window.AudioContext || window.webkitAudioContext)();
    var request = new XMLHttpRequest();
    var source = context.createBufferSource();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            source.buffer = buffer;
            source.connect(context.destination);
            source.start(0);
            
            if (youtubePlayer) {
                playerOrgVolume = youtubePlayer.getVolume();
                youtubePlayer.setVolume(Math.round(playerOrgVolume * 0.15));
            
                source.onended = function() { youtubePlayer.setVolume(playerOrgVolume); };
            }
        });
    }
    request.send();
}

function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player('youtubePlayer', {
      height: '90',
      width: '100%',
      events: {
      }
    });
}

function separateRole(role)
{
    playersWithRole = [];
    playersWithoutRole = [];
    
    for (i = 0; i < playerNames.length; i++) {
        if (playerAlive[i])
        {
            if (getSuperRole(playerRoles[i]) == role)
                playersWithRole.push(playerNames[i]);
            else
                playersWithoutRole.push(playerNames[i]);
        }
    }
    
    return [playersWithRole, playersWithoutRole];
}

function getRolePlayer(role)
{
    for (i = 0; i < playerNames.length; i++) {
        if (playerAlive[i])
        {
            if (playerRoles[i] == role)
                return i;
        }
    }
}

function getPlayerFaction(id)
{
    if (playerRoles[id] == "Mafia" || playerRoles[id] == "Barkeeper")
        return "Mafia"
    else
        return "Town"
}

function getSuperRole(role)
{
    if (role == "Barkeeper")
        return "Mafia"
    else
        return role
}

// Night-logic
function beginNight()
{
    if (youtubePlayer) youtubePlayer.playVideo();
    playerTargets = new Array(playerNames.length);
    
    speakText("It is now night. All players close your eyes.");
    logEvent("Night " + currentNight + " has started!");
    
    setTimeout(function(){ wakeRole("Mafia"); }, 10000);
    
    $("#btnStartNight").prop('disabled', true);
}

function chosenTarget(issuer, target)
{
    var playerID = getPlayerID(issuer);
    var role = playerRoles[playerID];
    
    playerTargets[playerID] = getPlayerID(target);
    logEvent(issuer + " [" + role + "] has targeted " + target + "!");
    
    processTargets(playerID);
}

function processTargets(player)
{
    if (currentRole == "Mafia")
    {
        var separatedPlayers = separateRole("Mafia");
        for (i = 0; i < separatedPlayers[0].length; i++) {
            if (playerTargets[separatedPlayers[0][i]] == null)
            {
                return;
            }
        }
        
        // TODO
    }
    else if (currentRole == "Detective")
    {
        var target = playerTargets[player];
        executeCommand("infoAndConfirm", playerNames[player], playerNames[target] + " is <b>" + ((getPlayerFaction(target) == "Mafia") ? "Mafia" : "NOT Mafia") + "</b>.");
        
        return;
    }
    else if (currentRole == "Policeman")
    {
        if (policeReference == -1)
        {
            policeReference = playerTargets[player];
        }
        else
        {
            var target = playerTargets[player];
            executeCommand("infoAndConfirm", playerNames[player], playerNames[target] + " and " + playerNames[policeReference] + " are in <b>" + ((getPlayerFaction(target) == getPlayerFaction(policeReference)) ? "THE SAME</b> faction." : "DIFFERENT</b> factions."));
            return;
        }
    }
    
    speakText("Okay! " + currentRole + " close your eyes.");
    wakeNext();
}

function infoConfirmed(issuer)
{
    speakText("Okay! " + currentRole + " close your eyes.");
    wakeNext();
}

function wakeNext() {
    var isNextRole = false;
    $('#roleForm').find('input').each(function(){
        var elem = $(this);
        var elemID = elem.attr("id").replace("num", "");
        if ($.isNumeric(elem.val()))
        {
            if ((!elem.is(":checkbox") && elem.val() > 0) || elem.prop("checked"))
            {
                if (isNextRole)
                {
                    if (elemID == "VillageIdiot")
                        setTimeout(function(){ wakeAll(); }, 7000);
                    else
                        setTimeout(function(){ wakeRole(elemID); }, 7000);
                    
                    return false
                }
                else if (elemID == currentRole)
                    isNextRole = true;
            }
        }
    });
}

function wakeRole(role)
{   
    currentRole = role;
    
    var separatedPlayers = separateRole(getSuperRole(role));
    for (i = 0; i < separatedPlayers[0].length; i++) {
        if (role == "Barkeeper" && playerRoles[getPlayerID(separatedPlayers[0][i])] != "Barkeeper")
            continue;
        
        executeCommand("chooseTarget", separatedPlayers[0][i], separatedPlayers[1].join("~"));
    }
    
    speakText(role + ". Open your eyes and choose your target.");
}

function wakeAll()
{
    if (youtubePlayer) youtubePlayer.pauseVideo();
    
    speakText("The night is over. Everyone wake up.");
    logEvent("Night " + currentNight + " has ended!");
    
    currentNight ++;
    $("#btnStartNight").prop('disabled', false);
}