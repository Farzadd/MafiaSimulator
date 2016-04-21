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
    else if ($i_command == "confirmConnection")
        echo confirmConnection();
    else
        echo "ERROR 001: Invalid command";

    function createSession()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        if ($i_arg1 == "")
            return "ERROR 002: Insufficient arguments";
        
        $playerNames = explode(",", $i_arg1);
        $rand = rand ( 100, 999 );
        
        session_id( "x" . $playerNames[0] . $rand );
        session_start();
        
        $_SESSION['night'] = 0;
        $_SESSION['server_id'] = $i_issuer;
        $_SESSION['players'] = $i_arg1;
        $_SESSION['messageQueue_' . $i_issuer] = array();
        
        return  $playerNames[0] . $rand;
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
        
        $_SESSION['messageQueue_' . $i_issuer] = array();
        addToMessageQueue("confirmConnection", "", "");
        return "CONNECTED";
    }
    
    function updateClient()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        addToMessageQueue("updateFromServer", $i_arg1, $i_arg2);
        return "UPDATED";
    }
    
    function chooseTarget()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        addToMessageQueue("chooseTarget", $i_arg1, $i_arg2);
        return "SENT";
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
        
        $messages = $_SESSION['messageQueue_' . $queue];
        array_push($messages, $message_comp);
        $_SESSION['messageQueue_' . $queue] = $messages;
        
        return "SUCCESS";
    }
    
    function pullMessages()
    {
        global $i_issuer, $i_session, $i_arg1, $i_arg2;
        
        session_id( "x" . $i_session );
        session_start();
        
        $messages = $_SESSION['messageQueue_' . $i_issuer];
        $_SESSION['messageQueue_' . $i_issuer] = array();
        
        return json_encode($messages);
    }
?>