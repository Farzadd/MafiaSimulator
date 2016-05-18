<?php
    $i_issuer = $_REQUEST['id'];
    $i_command = $_REQUEST['cmd'];
    $i_session = $_REQUEST['session'];
    $i_arg1 = $_REQUEST['arg1'];
    $i_arg2 = $_REQUEST['arg2'];
    
    if ($i_command == "createSession")
        echo createSession();
    else if ($i_command == "getNightNum")
        echo getNightNum();
    else if ($i_command == "pullMessages")
        echo pullMessages();
    else if ($i_command == "joinServer")
        echo joinServer();
    else if ($i_command == "updateClient")
        echo updateClient();
    else if ($i_command == "chooseTarget")
        echo chooseTarget();
    else if ($i_command == "chosenTarget")
        echo chosenTarget();
    else if ($i_command == "infoAndConfirm")
        echo infoAndConfirm();
    else if ($i_command == "infoConfirmed")
        echo infoConfirmed();
    else if ($i_command == "gameOver")
        echo gameOver();
    else if ($i_command == "confirmConnection")
        echo confirmConnection();
    else if ($i_command == "setDeathMessage")
        echo setDeathMessage();
    else
        echo "ERROR 001: Invalid command";

    function createSession()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        if ($i_arg1 == "")
            return "ERROR 002: Insufficient arguments";
        
        $playerNames = explode(",", $i_arg1);
        $rand = rand ( 10, 99 );
        
        $gameID = substr($playerNames[0], 0, 1) . $rand;
        session_id( "x" . $gameID );
        session_start();
        
        $_SESSION['night'] = 0;
        $_SESSION['pid'] = 0;
        $_SESSION['server_id'] = $i_issuer;
        $_SESSION['players'] = $i_arg1;
        $_SESSION['messageQueue_' . $i_issuer] = array();
        
        foreach ($playerNames as $player)
        {
            $_SESSION['messageQueue_' . $player] = array();
        }
        
        return  $gameID;
    }
    
    function joinServer()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        if (!isset($_SESSION['night']) || $_SESSION['night'] != 0)
            return "FAIL";
        
        return $_SESSION['players'];
    }
    
    function confirmConnection()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        if (!isset($_SESSION['messageQueue_' . $i_issuer]))
            $_SESSION['messageQueue_' . $i_issuer] = array();
        
        return addToMessageQueue("confirmConnection", "", "");
    }
    
    function updateClient()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("updateFromServer", $i_arg1, $i_arg2);
    }
    
    function chooseTarget()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
       
        return addToMessageQueue("chooseTarget", $i_arg1, $i_arg2);
    }
    
    function chosenTarget()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("chosenTarget", "", $i_arg1);
    }
    
    function infoAndConfirm()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("infoAndConfirm", $i_arg1, $i_arg2);
    }
    
    function infoConfirmed()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("infoConfirmed", "", "");
    }
    
    function setDeathMessage()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("setDeathMessage", $i_arg1, $i_arg2);
    }
    
    function gameOver()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return addToMessageQueue("gameOver", $i_arg1, $i_arg2);
    }
    
    function getNightNum()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        return $_SESSION['night'];
    }
    
    function addToMessageQueue($message, $queue, $arg)
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        if ($queue == "")
        {
            $queue = $_SESSION['server_id'];
        }
        
        $message_comp["issuer"] = $i_issuer;
        $message_comp["message"] = $message;
        $message_comp["arg"] = $arg;
        
        if ($queue == "R_ALL_PLAYERS_B")
        {
            $playerNames = explode(",", $_SESSION['players']);
            
            foreach ($playerNames as $player)
            {
                if (isset($_SESSION['messageQueue_' . $player])) {
                    $messages = $_SESSION['messageQueue_' . $player];
                    array_push($messages, $message_comp);
                    $_SESSION['messageQueue_' . $player] = $messages;
                }
            }
            
            return "SUCCESS";
        }
        else
        {
            if (isset($_SESSION['messageQueue_' . $queue])) {
                $messages = $_SESSION['messageQueue_' . $queue];
                array_push($messages, $message_comp);
                $_SESSION['messageQueue_' . $queue] = $messages;
                return "SUCCESS";
            } else {
                return "PLAYER NOT CONNECTED";
            }
        }
    }
    
    function pullMessages()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        $messages = $_SESSION['messageQueue_' . $i_issuer];
        $_SESSION['messageQueue_' . $i_issuer] = array();
        
        $_SESSION['pid'] = ($_SESSION['pid'] + 1) % 500;
        
        return json_encode($messages);
    }
?>