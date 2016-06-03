package ca.daei.mafiasimulator;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import org.json.*;

import com.android.volley.*;
import com.android.volley.toolbox.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Timer;
import java.util.TimerTask;

public final class MafiaCore {
    public enum GameStates
    {
        GAME_DISCONNECTED,
        GAME_READY,
        GAME_OVER
    }

    public static String USERID = "";
    public static String USERROLE = "";
    public static boolean USERALIVE = false;

    public static String GAMEID = "";
    public static GameStates GAMESTATE = GameStates.GAME_DISCONNECTED;
    public static ArrayList<String> PLAYERSALIVE = new ArrayList<>();
    public static ArrayList<String> PLAYERSDEAD = new ArrayList<>();

    public static Context currentContext;

    public static void executeCommand(String command, String arg1, String arg2, Response.Listener callback, Context context) {
        executeCommand(command, arg1, arg2, callback, context, 0);
    }

    private static void executeCommand(final String command, final String arg1, final String arg2, final Response.Listener callback, final Context context, final int attempt)
    {
        // Instantiate the RequestQueue.
        RequestQueue queue = Volley.newRequestQueue(context);
        String url = "http://mafia.daei.ca/server.php?"
                + "id=" + USERID
                + "&session=" + GAMEID
                + "&cmd=" + command
                + "&arg1=" + arg1
                + "&arg2=" + arg2;

        // Request a string response from the provided URL.
        StringRequest stringRequest = new StringRequest(Request.Method.GET, url,
                callback, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                if (attempt < 5) {
                    executeCommand(command, arg1, arg2, callback, context, attempt + 1);
                }
            }
        });
        // Add the request to the RequestQueue.
        queue.add(stringRequest);
    }

    public static void setCurrentContext(Context context)
    {
        currentContext = context;
    }

    public static void listen()
    {
        TimerTask listenTask = new TimerTask() {
            public void run()
            {
                MafiaCore.executeCommand("pullMessages", MafiaCore.GAMEID, "", listen_post, currentContext);
            }
        };

        Timer listenTimer = new Timer("mainListenTimer");
        listenTimer.schedule(listenTask, 100, 4000);
    }

    static Response.Listener listen_post = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            if (response.equals("") || response.equals("[]"))
                return;

            try {
                JSONArray j = new JSONArray(response);

                if (j.length() == 0)
                    return;

                for (int c = 0; c < j.length(); c++)
                {
                    handleCommand(j.getJSONObject(c).getString("issuer"),
                            j.getJSONObject(c).getString("message"),
                            j.getJSONObject(c).getString("arg"));
                }

            } catch (JSONException ex)
            {
            }
        }
    };

    public static void handleCommand(String issuer, String message, String arg)
    {
        switch (message)
        {
            case "updateFromServer":
                try {
                    JSONArray jArg = new JSONArray(arg);
                    USERALIVE = jArg.getBoolean(0);
                    USERROLE = jArg.getString(1);
                    Collections.addAll(PLAYERSALIVE, jArg.getString(2).split("~"));
                    Collections.addAll(PLAYERSDEAD, jArg.getString(3).split("~"));

                    if (GAMESTATE == GameStates.GAME_DISCONNECTED)
                    {
                        // Change the activity to the main activity
                        Intent mainIntent = new Intent(currentContext, Main.class);
                        currentContext.startActivity(mainIntent);
                    }
                } catch (JSONException ex) {}
                break;
            case "chooseTarget":
                break;
            case "infoAndConfirm":
                break;
            case "gameOver":
                break;
            case "updateGameRules":
                break;
            default:
                Log.d("[handleCommand]", "Invalid command issued: " + message);
        }
    }

    public static void disconnect()
    {
        USERID = "";
        USERALIVE = false;
        USERROLE = "";
        GAMESTATE = GameStates.GAME_DISCONNECTED;
    }
}
