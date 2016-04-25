var playerNames = [];
var playerRoles = [];
var playerAlive = [];
var playerConnected = [];
var playerTargets = [];

var roleCount = 0;
var gameStarted = false;

var currentNight = 0;
var currentRole = "";

var mafiaTarget = [];
var mafiaKillId = 0;
var medicTarget = -1;
var policeReference = -1;
var vigiTarget = -1;
var oracleTarget = -1;
var prostituteTarget = -1;

var youtubePlayer;
var playerOrgVolume;
var context = new (window.AudioContext || window.webkitAudioContext)();


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
    tempString = "<table class=\"table table-striped\"><tr><th>#</th><th>Name</th><th>Actions</th><th>Status</th><th>Role</th></tr>";
    jQuery.each( playerNames, function( i, val ) {
        tempString += "<tr><td>" + (i+1) + "</td><td id=\"pnl_" + val + "\">" + val + "</td><td><button class=\"btn btn-xs btn-danger pLynch\" style=\"display:none;\" data-id=\"" + i + "\">LYNCH</button></td><td id=\"pStatus" + i + "\">PRE-GAME</td><td><a id=\"pRole" + i + "\" data-toggle=\"tooltip\" data-placement=\"right\" title=\"Unassigned\">ROLE</a></td></li>";
    });
    tempString += "</table>";
    
    $( "#playerList" ).html(tempString);
    $('[data-toggle="tooltip"]').tooltip();
    
    $(".pLynch").click(function() {
        if (gameStarted)
        {
            if (confirm("Are you sure you want lynch " + playerNames[$(this).attr("data-id")] + "?"))
            {
                changePlayerStatus($(this).attr("data-id"), false);
                logEvent(playerNames[$(this).attr("data-id")] + " has been lynched.");
                speakText(playerNames[$(this).attr("data-id")] + " has been lynched.");
                
                var winner = checkWinCondition();
                if (winner != "")
                {
                    speakText("The game is over... The " + winner + " has won!");
                    logEvent("The game is over... The " + winner + " has won!");
                }
            }
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
        
        playerConnected = new Array(playerNames.length);
        playerAlive = new Array(playerNames.length);
    
        assignRoles();
        
        disableForm("roleForm");
        disableForm("settingForm");
        
        userID = Math.floor((Math.random() * 8999) + 1000);
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
    
    updateAllClients();
}

function updateClient(player)
{
    if (!playerConnected[player])
        return;
    
    var alivePlayers = [];
    var deadPlayers = [];
    
    for (uc_i = 0; uc_i < playerNames.length; uc_i++) {
        if (playerAlive[uc_i])
            alivePlayers.push(playerNames[uc_i]);
        else
            deadPlayers.push(playerNames[uc_i]);
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
    var alivePlayers = [];
    var deadPlayers = [];
    
    for (cl_id = 0; cl_id < playerNames.length; cl_id++) {
        if (playerAlive[cl_id])
            alivePlayers.push(playerNames[cl_id]);
        else
            deadPlayers.push(playerNames[cl_id]);
    }
    
    var updateArr = [];
    updateArr[0] = false;
    updateArr[1] = "";
    updateArr[2] = alivePlayers.join("~");
    updateArr[3] = deadPlayers.join("~");
    
    for (cl_id = 0; cl_id < playerNames.length; cl_id++)
    {   
        if (playerConnected[cl_id])
        {
            updateArr[0] = playerAlive[cl_id];
            updateArr[1] = playerRoles[cl_id];
            
            executeCommand("updateClient", playerNames[cl_id], JSON.stringify(updateArr));
        }
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
    var playersWithRole = [];
    var playersWithoutRole = [];
    
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

function countFaction(includeDead)
{
    var mafiaCount = 0;
    var townCount = 0;
    
    for (cf_i = 0; cf_i < playerNames.length; cf_i++) {
        if (playerAlive[cf_i] || includeDead)
        {
            if (getPlayerFaction(cf_i) == "Mafia")
                mafiaCount++;
            else
                townCount++;
        }
    }
    
    return [mafiaCount, townCount];
}

// Night-logic
function beginNight()
{
    if (youtubePlayer) youtubePlayer.playVideo();
    playerTargets = new Array(playerNames.length);
    mafiaKillId = 0;
    mafiaTarget = [];
    medicTarget = -1;
    oracleTarget = -1;
    prostituteTarget = -1;
    
    $(".pLynch").prop("disabled", true);
    
    speakText("It is now night. All players close your eyes.");
    logEvent("Night " + currentNight + " has started!");
    
    setTimeout(function(){ wakeRole("Mafia"); }, 10000);
    
    $("#btnStartNight").prop('disabled', true);
}

function chosenTarget(playerName, target)
{
    var player = getPlayerID(playerName);
    var role = playerRoles[player];
    var targetID = getPlayerID(target);
   
    playerTargets[player] = getPlayerID(target);
    
    if (currentRole == "Mafia")
    {
        var separatedPlayers = separateRole("Mafia");
        var mTarget = -1;
        var inconsistent = false;
        for (i = 0; i < separatedPlayers[0].length; i++) {
            var pID = getPlayerID(separatedPlayers[0][i]);
            if (playerTargets[pID] == undefined)
            {
                return;
            }
            else if (mTarget == -1)
                mTarget = playerTargets[pID];
            else if (mTarget != playerTargets[pID])
                inconsistent = true;
        }
        
        if (inconsistent)
        {
            logEvent("Mafia has inconsistent voting... try again!");
            speakText("Mafia! Please choose a single target for your kill!");
            
            for (i = 0; i < separatedPlayers[0].length; i++) {
                playerTargets[getPlayerID(separatedPlayers[0][i])] = undefined;
            }
            
            batchChooseTarget("Mafia");
            
            return;
        } else {
            // Record target
            mafiaTarget[mafiaKillId] = mTarget;
            mafiaKillId ++;
            
            logEvent("Mafia has chosen " + playerNames[mTarget] + " as kill #" + mafiaKillId + "!");
            
            // Next legit kill
            if (mafiaKillId < calculateKillPower())
            {
                for (i = 0; i < separatedPlayers[0].length; i++) {
                    playerTargets[getPlayerID(separatedPlayers[0][i])] = undefined;
                }
                
                speakText("Mafia! Please choose target number " + (mafiaKillId+1) + "!");
                batchChooseTarget("Mafia");
                
                return;
            }
            
            // Fake kill
            if (mafiaKillId < $("#numMafiaPower").val())
            {
                fakeMafiaKill();
                return;
            }
        }
    }
    else if (currentRole == "Detective")
    {
        logEvent(playerName + " [Detective] has checked " + target + "!");
        executeCommand("infoAndConfirm", playerName, target + " is <b>" + ((getPlayerFaction(targetID) == "Mafia") ? "Mafia" : "NOT Mafia") + "</b>.");
        
        return;
    }
    else if (currentRole == "Policeman")
    {
        if (policeReference == -1)
        {
            policeReference = targetID;
            logEvent(playerName + " [Policeman] has chosen " + target + " as their reference!");
        }
        else
        {
            logEvent(playerName + " [Policeman] has compared " + target + " to " + playerNames[policeReference] + "!");
            
            executeCommand("infoAndConfirm", playerName, target + " and " + playerNames[policeReference] + " are in <b>" + ((getPlayerFaction(targetID) == getPlayerFaction(policeReference)) ? "THE SAME</b> faction." : "DIFFERENT</b> factions."));
            return;
        }
    }
    else if (currentRole == "Medic")
    {
        medicTarget = targetID;
        logEvent(playerName + " [Medic] wants to save " + target + "!");
    }
    else if (currentRole == "Vigilante")
    {
        if (targetID == -1)
            logEvent(playerName + " [Vigilante] has chosen not to shoot.");
        else {
            vigiTarget = targetID;
            logEvent(playerName + " [Vigilante] has taken their shot at " + target + "!");
        }
    }
    else if (currentRole == "Oracle")
    {
        oracleTarget = targetID;
        logEvent(playerName + " [Oracle] has focused on " + target + ".");
    }
    else if (currentRole == "Prostitute")
    {
        prostituteTarget = targetID;
        logEvent(playerName + " [Prostitute] has taken " + target + " home!");
    }
    else
    {
        logEvent(playerName + " [" + role + "] has targeted " + target + "!");
    }
    
    speakText("Okay! " + currentRole + " close your eyes.");
    wakeNext();
}

function fakeMafiaKill()
{
    if (mafiaKillId < $("#numMafiaPower").val())
    {
        speakText("Mafia! Please choose target number " + (mafiaKillId+1) + "!");
        setTimeout(fakeMafiaKill, Math.floor((Math.random() * 10000) + 10000) );
        mafiaKillId ++;
    } else {
        speakText("Okay! Mafia close your eyes.");
        wakeNext();
    }
}

function fakeDead()
{
    speakText("Okay! " + currentRole + " close your eyes.");
    wakeNext();
}

function infoConfirmed(issuer)
{
    speakText("Okay! " + currentRole + " close your eyes.");
    wakeNext();
}

function calculateKillPower()
{
    var aliveMafiaCount = countFaction(false)[0];
    var pointsPerMafia = $("#numMafiaPower").val() / $("#numMafia").val()
    
    return Math.ceil(aliveMafiaCount * pointsPerMafia);
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
                    if (elemID == "VillageIdiot") {
                        return true;
                    }
                    
                    setTimeout(function(){ wakeRole(elemID); }, 7000);
                    isNextRole = false;
                    return false
                }
                else if (elemID == currentRole)
                    isNextRole = true;
            }
        }
    });
    
    if (isNextRole)
        setTimeout(function(){ wakeAll(); }, 7000);
}

function wakeRole(role)
{   
    currentRole = role;
    
    if ( batchChooseTarget(role) == 0 || (role == "Vigilante" && vigiTarget != -1) )
        setTimeout(fakeDead, Math.floor((Math.random() * 11000) + 9000) );
    
    speakText(role + ". Open your eyes and choose your target.");
}

function batchChooseTarget(role)
{
    var separatedPlayers = separateRole(getSuperRole(role));
    
    if (role == "Policeman" && policeReference != -1)
    {
        var index = separatedPlayers[1].indexOf(playerNames[policeReference]);
        if (index != -1)
            separatedPlayers[1].splice(index, 1);
    }
    else if (role == "Vigilante")
    {
        separatedPlayers[1].unshift("None");
    }
    
    for (wr_i = 0; wr_i < separatedPlayers[0].length; wr_i++) {
        if (role == "Barkeeper" && playerRoles[getPlayerID(separatedPlayers[0][wr_i])] != "Barkeeper")
            continue;
        
        executeCommand("chooseTarget", separatedPlayers[0][wr_i], separatedPlayers[1].join("~"));
    }
    
    return separatedPlayers[0].length;
}

function wakeAll()
{
    if (youtubePlayer) youtubePlayer.pauseVideo();
    
    speakText("The night is over. Everyone wake up.");
    logEvent("Night " + currentNight + " has ended!");
    
    $(".pLynch").prop("disabled", false);
    
    setTimeout(processAndAnnounce, 6000);
    
    currentNight ++;
    $("#btnStartNight").prop('disabled', false);
}

function processAndAnnounce()
{
    var shotList = [];
    for (t = 0; t < mafiaTarget.length; t++)
    {
        if (shotList.indexOf(mafiaTarget[t]) != -1)
            logEvent("The Mafia have double-tapped " + playerNames[mafiaTarget[t]] + "!");
        
        shotList.push(mafiaTarget[t]);
    }
    
    if (vigiTarget != -1)
        shotList.push(vigiTarget);
        
    if (medicTarget != -1)
    {
        var iMedicT = shotList.indexOf(medicTarget);
        if (iMedicT != -1)
        {
            logEvent("The Medic has saved " + playerNames[medicTarget] + " from a bullet!");
            shotList.splice(iMedicT, 1);
        }
    }
    
    if (prostituteTarget != -1)
    {
        var iProstitute = shotList.indexOf( getRolePlayer("Prostitute") );
        var iProstituteT = shotList.indexOf(prostituteTarget);
        if (iProstitute != -1)
        {
            logEvent("The Prostitute has taken " + playerNames[prostituteTarget] + " down with her!");
            shotList.push(prostituteTarget);
        }
        else if (iProstituteT != -1)
        {
            logEvent("The Prostitute has saved " + playerNames[prostituteTarget] + "!");
            do {
                shotList.splice(iProstituteT, 1);
                iProstituteT = shotList.indexOf(prostituteTarget);
            }
            while (iProstituteT != -1);
        }
    }
    
    if (shotList.length == 0)
        speakText("No one has died!");
    else
    {
        var announcement = "The following people have been killed";
        var ourOracle = getRolePlayer("Oracle");
        
        for (t = 0; t < shotList.length; t++)
        {
            changePlayerStatus(shotList[t], false);
            announcement = announcement + ", " + playerNames[shotList[t]];
        }
        
        if (shotList.indexOf(ourOracle) != -1)
            announcement = announcement + ". Oracle has died, " + playerNames[oracleTarget] + " is " + playerRoles[oracleTarget];
        
        var winner = checkWinCondition();
        if (winner != "")
            announcement = announcement + ". The game is over... The " + winner + " has won!";
        
        announcement = announcement + ".";
        speakText(announcement);
        logEvent(announcement);
    }
}

function checkWinCondition()
{
    var count = countFaction(false);
    
    if (count[0] == 0)
    {
        $("#gameStatus").text("Town Victory");
        executeCommand("gameOver", "R_ALL_PLAYERS_B", "Town");
        return "Town"
    }
    else if (count[0] >= count[1])
    {
        $("#gameStatus").text("Mafia Victory");
        executeCommand("gameOver", "R_ALL_PLAYERS_B", "Mafia");
        return "Mafia";
    }
    
    return "";
}