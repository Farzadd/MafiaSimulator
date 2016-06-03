package ca.daei.mafiasimulator;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import com.android.volley.Response;

public class JoinGame extends AppCompatActivity {

    public final static String EM_RESPONSE = "ca.daei.mafiasimulator.RESPONSE";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_join_game);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        // Init Core
        MafiaCore.setCurrentContext(this);

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Create game has not yet been implemented!", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
            }
        });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_join_game, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    public void performJoin(View view)
    {
        // Show Progress
        ProgressBar pb = (ProgressBar) findViewById(R.id.joinGameProgress);
        pb.setVisibility(View.VISIBLE);

        // Retrieve game ID
        EditText jgID = (EditText) findViewById(R.id.joinGameID);
        MafiaCore.GAMEID = jgID.getText().toString();

        // Execute join command
        MafiaCore.disconnect();
        MafiaCore.executeCommand("joinServer", "", "", performJoin_post, getApplicationContext());

        // Disable join button
        Button bJoin = (Button) findViewById(R.id.joinGameButton);
        bJoin.setEnabled(false);
    }

    Response.Listener performJoin_post = new Response.Listener<String>() {
        @Override
        public void onResponse(String response) {
            // Reset the UI
            ProgressBar pb = (ProgressBar) findViewById(R.id.joinGameProgress);
            pb.setVisibility(View.INVISIBLE);
            Button bJoin = (Button) findViewById(R.id.joinGameButton);
            bJoin.setEnabled(true);

            // The response was a failure
            if (response.equals("FAIL"))
            {
                new AlertDialog.Builder(JoinGame.this)
                        .setTitle("Unable to join")
                        .setMessage("No game with such ID exists. Are you sure you have the right game ID?")
                        .setNeutralButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                // do nothing
                            }
                        })
                        .setIcon(android.R.drawable.ic_dialog_alert)
                        .show();
            }
            else
            {
                Intent selectPlayerIntent = new Intent(getApplicationContext(), SelectPlayer.class);
                selectPlayerIntent.putExtra(EM_RESPONSE, response);
                startActivity(selectPlayerIntent);
            }

        }
    };
}
