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
            tempString += "<button class=\"btn btn-success selectPlayer\" type=\"button\" style=\"margin-right: 10px;\">" + val + "</button>";
        });
        tempString += "</center></div>";
        $("#divSelectPlayer").html(tempString);
        
        $(".selectPlayer").click(function() {
            userID = $(this).text();
            var response = executeCommand("confirmConnection");
            
            $("#playerName").text(userID);
            
            $("#divSelectPlayer").hide();
            $("#divPlayerInfo").show();
        });
    }
    $("#divJoinGame").hide();
    $("#divSelectPlayer").show();
});