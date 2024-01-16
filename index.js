import express, { response } from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {Server} from 'socket.io'
import {JSDOM} from 'jsdom';
//import pkg from 'string-similarity';
//const {stringSimilarity} = pkg;

//https://nodejs.org/api/esm.html#:~:text=The%20CommonJS%20module%20require%20always,module%20from%20a%20CommonJS%20module.
import { default as stringSimilarity } from 'string-similarity';
const app = express();
const server = createServer(app);
const io = new Server(server);
var users = new Map();
var rooms = [];
var userRooms = new Map();
var games = {}
const __dirname = dirname(fileURLToPath(import.meta.url));


app.use(express.static(__dirname + '/public'));

console.log(await getAccessKey());

console.log(stringSimilarity.compareTwoStrings("The Black Eyed Peas", "Black Eyed Peas"));
console.log(stringSimilarity.compareTwoStrings("michale hjacosn", "michael Jackson"));
console.log(stringSimilarity.compareTwoStrings("micahe lajcka", "michael jackson"));
//app.use(express.static('/public'));

//const __dirname = dirname(fileURLToPath(import.meta.url));
/*
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '/index.html'));
});*/

io.on('connection', (socket) => {
    console.log('a user connected ');
    //io.to(socket.id).emit("roomjoin");
    socket.on('room', (data) => {
      console.log(data);
       //console.log("Room set up!");
       if (Object.keys(games).includes(data.room) == false ) {
       users.set(socket.id, data.user);
       if (rooms.indexOf(data.room) == -1) {
        rooms.push(data.room);
       }
       userRooms.set(socket.id, data.room);
       socket.join(data.room);
       console.log("Room set up!");
       var lolusers = [];
       for (const key of userRooms.keys()) {
        console.log("Don't be racist");
        if (userRooms.get(key) == data.room) {
          lolusers.push(users.get(key));
        }
        
      }
      var bob = data.room;
      console.log(data.room);
       io.to(bob).emit("roomjoin", {roomName: bob, users: lolusers});
    }
    });

    socket.on("startGame", async (data)=> {
      //https://developer.spotify.com/documentation/web-api/tutorials/getting-started
      const accessToken = await getAccessKey();
      console.log(accessToken);
      const playlistData = await getPlaylistData(accessToken);
      //console.log(playlistData);
      console.log(playlistData.length);
      var songs = {};
      var counter = 1;
      for (var tracks of playlistData) {
        var song = {};
        song["artist"] = tracks["track"]["artists"][0]["name"];
        song["name"] = tracks["track"]["name"];
        song["audio"] = await getSongAudio(tracks["track"]["id"]);
        songs[counter.toString()] = song;
        counter++;
      }
      var scoreboard = {};

      var lolusers = [];
      for (const key of userRooms.keys()) {
        //console.log("Don't be racist");
        if (userRooms.get(key) == data.room) {
          lolusers.push(users.get(key));
        }
      }
      for (var user of lolusers) {
        scoreboard[user] = 0;
      }
      console.log(JSON.stringify(songs));
      games[data.room] = {"round":1, "songs":songs, "scoreboard":scoreboard};
      console.log(games);
      for (let rounds = 0; rounds < (Object.keys(games[data.room]["songs"]).length + 1); rounds++) {
        console.log(rounds.toString());
        io.to(data.room).emit("roundStart", {room: data.room, round: games[data.room]["round"], audio: games[data.room]["songs"][games[data.room]["round"].toString()]["audio"], "scoreboard":games[data.room]["scoreboard"]});
        await later(30000);
        console.log("Woah the timer worked?");
        games[data.room]["round"] = games[data.room]["round"] + 1;
      }
    });

    



  });

  async function later(delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}

  server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });

  async function getSongAudio(songId) {
    //https://github.com/spotify/web-api/issues/148#issuecomment-628197023

    var response = await fetch("https://open.spotify.com/embed/track/" + songId);
    var songHTML = await response.text();
    //console.log(songHTML);
    var scriptText = await scrapeSpotifyEmbed(songHTML);
    var scriptJSON = JSON.parse(scriptText);
    var audioURL = scriptJSON["props"]["pageProps"]["state"]["data"]["entity"]["audioPreview"]["url"]
    //console.log(audioURL);
    return audioURL;
  }

  async function scrapeSpotifyEmbed(songHtml) {
    var dom = new JSDOM(songHtml);
    var document = dom.window.document;
    return document.getElementById("__NEXT_DATA__").innerHTML;
  }

  async function getPlaylistData(accessToken) {
    var response = await fetch("https://api.spotify.com/v1/playlists/58ni8jbNEpmnUQhwep5W8Z/tracks?market=US", {
        method: 'GET',
        headers: {
          "Authorization": "Bearer " + accessToken
        }
      })
    var jsonData = await response.json();
    //console.log(jsonData["tracks"]["total"]);
    return await jsonData["items"];
      
  }

  async function getAccessKey() {

    var urlencoded = new URLSearchParams();
      urlencoded.append("client_id", process.env.CLIENTID);
      urlencoded.append("client_secret", process.env.CLIENTSECRET);
      urlencoded.append("grant_type", "client_credentials");

    var options = {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: urlencoded
    }

    var url = "https://accounts.spotify.com/api/token";
    var response = await fetch(url, options);
    var jsonResponse = await response.json();
    console.log("Boo!" + jsonResponse);
    return await jsonResponse["access_token"];
  }