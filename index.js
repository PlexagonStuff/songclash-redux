import express, { response } from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {Server} from 'socket.io'
import {JSDOM} from 'jsdom';
//import pkg from 'string-similarity';
//const {stringSimilarity} = pkg;

//It looks like Deezer does not have any of these limitations when it comes to uses of their API on websites,
//so I may have to switch to it for the previews
//https://developers.deezer.com/guidelines

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
      let playlistData = await getPlaylistData(accessToken);
      //console.log(playlistData);
      console.log(playlistData.length);
      playlistData = await getRandomSubarray(playlistData, 10);

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
      var scoreboard = {"rounds": {}};

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
      for (var i = 1; i < 11; i++) {
        console.log(lolusers);
        scoreboard["rounds"][i.toString()] = {};
        for (var user of lolusers) {
          console.log(i + user);
          
          scoreboard["rounds"][i.toString()][user] = {"artist": false, "song": false, "first": false};
        }
        
      }
      console.log(JSON.stringify(songs));
      console.log(JSON.stringify(scoreboard));
      games[data.room] = {"round":1, "songs":songs, "scoreboard":scoreboard,"people":lolusers};
      console.log(games);
      for (let rounds = 0; rounds < (Object.keys(games[data.room]["songs"]).length); rounds++) {
        console.log(rounds.toString());
        io.to(data.room).emit("roundStart", {room: data.room, round: games[data.room]["round"], audio: games[data.room]["songs"][games[data.room]["round"].toString()]["audio"],artist: games[data.room]["songs"][games[data.room]["round"].toString()]["artist"],song: games[data.room]["songs"][games[data.room]["round"].toString()]["name"], scoreboard: games[data.room]["scoreboard"]});
        await later(30000);
        console.log("Woah the timer worked?");
        games[data.room]["round"] = games[data.room]["round"] + 1;
      }
      console.log("Welcome to the abyss of nothing...")
      await later(5000);
      var usersInRoom = [];
      //Apparently Iterators are different from Arrays, and Arrays are way more helpful, so this casting had to happen. Cringe
      console.log("Is this working?" + Array.from(userRooms.values()).length);
      for (var z = 0; z < Array.from(userRooms.values()).length; ++z) {
        
        if (Array.from(userRooms.values()).at(z) == data.room) {
          usersInRoom.push(Array.from(users.keys()).at(z));
        }
      }
      console.log(usersInRoom);
      for (var uzer of usersInRoom) {
        userRooms.delete(uzer);
        users.delete(uzer);
        
      }
      rooms.splice(rooms.indexOf(data.room));
      delete games[data.room];
      console.log(rooms);
      console.log(users);
      console.log(userRooms);
      console.log(JSON.stringify(games));
      

    });

    socket.on("processAnswers", async (data)=>{
      //room, round, answer
      console.log(JSON.stringify(data));
      console.log(users.get(socket.id));
      console.log(JSON.stringify(games[data.room]["scoreboard"]));

      var songArtist = games[data.room]["songs"][games[data.room]["round"].toString()]["artist"].toString();
      songArtist = String(songArtist).toLowerCase();
      console.log(songArtist);

      var titleArtist = String(games[data.room]["songs"][games[data.room]["round"].toString()]["name"]).toLowerCase()
      //console.log(songArtist);

      var artistSimilarity = stringSimilarity.compareTwoStrings(String(data.answer).toLowerCase(), songArtist);
      var titleSimilarity = stringSimilarity.compareTwoStrings(String(data.answer).toLowerCase(), titleArtist);

      console.log(artistSimilarity);
      console.log(titleSimilarity);

      var artistScore = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"];
      var titleScore = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"];

      if (artistSimilarity > 0.7) {
        if (artistScore == false) {
          artistScore = true;
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"] = true;
          games[data.room]["scoreboard"][users.get(socket.id)] += 1;
      }
        }
         
      if (titleSimilarity > 0.7) {
        if (titleScore == false) {
          titleScore = true;
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"] = true;
          games[data.room]["scoreboard"][users.get(socket.id)] += 1;
      }
      }
      io.to(socket.id).emit("unveilGuess", {artist: artistScore, title: titleScore});
      
      console.log("Got Artist? " + artistScore);
      console.log("Got Title? " + titleScore);
      console.log(artistScore && titleScore);
      
      if (artistScore && titleScore) {
        if (games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["first"] == false) {
          var firstWinner = true;
          for (var userz of games[data.room]["people"]) {
            if (userz != users.get(socket.id)) {
              console.log(userz);
               if (games[data.room]["scoreboard"]["rounds"][data.round.toString()][userz]["first"]) {
                firstWinner = false;
               }
            }
          }
          if (firstWinner == true) {
            console.log("wow, u the first");
            games[data.room]["scoreboard"][users.get(socket.id)] += 1;
            games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["first"] = true;
          }
        }
        
      }
      
      io.to(data.room).emit("scoreUpdate", {scoreboard: games[data.room]["scoreboard"]})





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
  //https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array/11935263#11935263
  async function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

  async function getSongAudio(songId) {
    //https://github.com/spotify/web-api/issues/148#issuecomment-628197023

    var response = await fetch("https://open.spotify.com/embed/track/" + songId);
    var songHTML = await response.text();
    //console.log(songHTML);
    var scriptText = await scrapeSpotifyEmbed(songHTML);
    var scriptJSON = JSON.parse(scriptText);
    //See bob.json for what a sample __NEXT_DATA__ script tag would contain.
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
    var response = await fetch("https://api.spotify.com/v1/playlists/37i9dQZF1DX1spT6G94GFC/tracks?market=US&limit=50", {
        method: 'GET',
        headers: {
          "Authorization": "Bearer " + accessToken
        }
      })
    var jsonData = await response.json();
    var offset = jsonData["total"] - 50 ;
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    offset = Math.floor(Math.random() * offset+1);
    //Requesting twice may seem a little silly, but this allows me to grab the size of the playlist to dynamically allow for greater
    //song ranges so that this plus selecting a random amount of items will provide greater song variation.
    console.log("Offset: " + offset);
    var response = await fetch("https://api.spotify.com/v1/playlists/37i9dQZF1DX1spT6G94GFC/tracks?market=US&limit=50"+"&offset="+offset, {
        method: 'GET',
        headers: {
          "Authorization": "Bearer " + accessToken
        }
      })
    var jsonData = await response.json();
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