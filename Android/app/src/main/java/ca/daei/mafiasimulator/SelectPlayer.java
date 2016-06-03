package ca.daei.mafiasimulator;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.ListView;
import android.widget.ProgressBar;

import com.android.volley.Response;

import java.util.ArrayList;
import java.util.Collections;

import ca.daei.mafiasimulator.adapters.PlayerListAdapter;

public class SelectPlayer extends AppCompatActivity implements JoinGameInterface {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_select_player);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        // Init Core
        MafiaCore.setCurrentContext(this);

        // Reset UI
        /*
        ListView playerList = (ListView) findViewById(R.id.playerList);
        playerList.setVisibility(View.VISIBLE);
        ProgressBar pb = (ProgressBar) findViewById(R.id.selectPlayerProgress);
        pb.setVisibility(View.INVISIBLE); */

        // Retrieve response
        Intent intent = getIntent();
        String response = intent.getStringExtra(JoinGame.EM_RESPONSE);

        if (response != null && !response.equals("")) {
            // Setup the player List
            ArrayList<String> list = new ArrayList<String>();
            Collections.addAll(list, response.split(","));
            PlayerListAdapter adapter = new PlayerListAdapter(list, this);

            // Assign adapter
            ListView playerList = (ListView) findViewById(R.id.playerList);
            playerList.setAdapter(adapter);
        }
    }

    public void joinAs(String playerName)
    {
        // Disable UI
        ListView playerList = (ListView) findViewById(R.id.playerList);
        playerList.setVisibility(View.INVISIBLE);
        ProgressBar pb = (ProgressBar) findViewById(R.id.selectPlayerProgress);
        pb.setVisibility(View.VISIBLE);

        // Select Player
        MafiaCore.USERID = playerName;

        // Execute join command
        MafiaCore.executeCommand("confirmConnection", "", "", confirmConnection_post, this);
    }

    Response.Listener confirmConnection_post = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            // Start listening
            MafiaCore.listen();
        }
    };
}
