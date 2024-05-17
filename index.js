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
import {default as levenshtein} from 'js-levenshtein';
const app = express();
const server = createServer(app);
const io = new Server(server);
var users = new Map();
var rooms = [];
var userRooms = new Map();
var games = {}
const __dirname = dirname(fileURLToPath(import.meta.url));


app.use(express.static(__dirname + '/public'));

//console.log(await getAccessKey());

console.log(stringSimilarity.compareTwoStrings("The Black Eyed Peas", "Black Eyed Peas"));
console.log(stringSimilarity.compareTwoStrings("michale hjacosn", "michael Jackson"));
console.log(stringSimilarity.compareTwoStrings("micahe lajcka", "michael jackson"));
console.log(levenshtein("kitten", "sitting"));
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
      console.log(JSON.stringify(data))
      //https://developer.spotify.com/documentation/web-api/tutorials/getting-started
      //const accessToken = await getAccessKey();
      //console.log(accessToken);
      //let playlistData = await getPlaylistData();
      //console.log(playlistData);
      //console.log(playlistData.length);
      let playlistData = await getRandomSubarray(10);

      var songs = {};
      var counter = 1;
      for (var tracks of playlistData) {
        var song = {};
        song["artist"] = tracks["artist"]["name"];
        song["name"] = tracks["title_short"];
        song["audio"] = tracks["preview"];//await getSongAudio(tracks["track"]["id"]);
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
          
          scoreboard["rounds"][i.toString()][user] = {"artist": [], "artistTrue": false, "songTrue": false, "song": [], "first": false};
        }
        
      }
      console.log(JSON.stringify(songs));
      console.log(JSON.stringify(scoreboard));
      games[data.room] = {"round":1, "songs":songs, "scoreboard":scoreboard,"people":lolusers};
      console.log(games);
      for (let rounds = 0; rounds < (Object.keys(games[data.room]["songs"]).length); rounds++) {
        console.log(rounds.toString());
        //Please ignore how long this line is.
        io.to(data.room).emit("roundStart", {room: data.room, round: games[data.room]["round"], audio: games[data.room]["songs"][games[data.room]["round"].toString()]["audio"],artist: games[data.room]["songs"][games[data.room]["round"].toString()]["artist"],song: games[data.room]["songs"][games[data.room]["round"].toString()]["name"], scoreboard: games[data.room]["scoreboard"]});

        //This timer implementation provided a way to show the time left to the players
        var timer = 29;
        for (timer; timer > 0; timer--) {
          io.to(data.room).emit("timer", {time: timer });
          await later(1000);
          var peeps = games[data.room]["people"]
          var counter = 0;
          for (var x = 0; x < peeps.length; x++) {
            var pals = peeps[x];
            if (games[data.room]["scoreboard"]["rounds"][games[data.room]["round"].toString()][pals]["artistTrue"] && games[data.room]["scoreboard"]["rounds"][games[data.room]["round"].toString()][pals]["songTrue"]) {
              counter++;
            }
          }
          if (counter == peeps.length) {
            if (games[data.room]["round"] != 10) {
              break;
            }
          }
            
          
        }
        io.to(data.room).emit("previousSong", {prevSong: games[data.room]["songs"][games[data.room]["round"].toString()]["name"], prevArtist: games[data.room]["songs"][games[data.room]["round"].toString()]["artist"]});
        console.log("Woah the timer worked?");
        games[data.room]["round"] = games[data.room]["round"] + 1;
      }
      console.log("Welcome to the abyss of nothing...")
      await later(5000);
      var usersInRoom = [];
      //Apparently Iterators are different from Arrays, and Arrays are way more helpful, so this casting had to happen. Cringe
      //This block also removes the users and game and room from the given arrays, Maps, and Objects so that a room with that
      //name can be re-initialized.
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

      //Send players back to the "main" screen
      io.to(data.room).emit("reset");
      //Closes the room connection
      io.in(data.room).disconnectSockets();
      delete games[data.room];
      console.log(rooms);
      console.log(users);
      console.log(userRooms);
      console.log(JSON.stringify(games));
      

    });
    /*
    THIS IS THE PROCESS ANSWER AREA!!!!!

    */

    socket.on("processAnswers", async (data)=>{
      //room, round, answer
      console.log(JSON.stringify(data));
      console.log(users.get(socket.id));
      console.log(JSON.stringify(games[data.room]["scoreboard"]));

      //This is a ton of stupid boilerplate but whatever

      var songArtist = games[data.room]["songs"][games[data.room]["round"].toString()]["artist"].toString();
      songArtist = String(songArtist).toLowerCase();
      //console.log(songArtist);
      var songArtistWords = songArtist.split(" ");

      var titleArtist = String(games[data.room]["songs"][games[data.room]["round"].toString()]["name"]).toLowerCase()
      var titleArtistWords = titleArtist.split(" ");
      //console.log(songArtist);

      var answerWordArray = data.answer.split(" ");

      var answerArtistWords = [];
      var answerTitleWords = [];
      
      //Check for word similarities in the artist name
      for (var answerWords of answerWordArray) {
        for (var targetWords of songArtistWords) {
          if (levenshtein(answerWords, targetWords) < 3) {
            answerArtistWords.push(targetWords);
          }
        }
      }

      //Check for word similarities in the song title
      for (var answerWords of answerWordArray) {
        for (var targetWords of titleArtistWords) {
          if (levenshtein(answerWords, targetWords) < 3) {
            answerTitleWords.push(targetWords);
          }
        }
      }

      //This section of code checks the found words from the given answer, and sees if they have been found/guessed
      //already. If they have not, then they are added to the found array for both artist and song name.

      var artistScore = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"];

      for (var answerWords of answerArtistWords) {
        if (!artistScore.includes(answerWords)) {
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"].push(answerWords);
        }
      }
      var titleScore = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"];

      for (var answerWords of answerTitleWords) {
        if (!titleScore.includes(answerWords)) {
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"].push(answerWords);
        }
      }

      /*
      * This section is super easy to understand. If the found word array length is the same as the total word array length, that
      * means that every word in the answer has been found, and that boolean is flipped true and the score increases. There is 
      * obviously a locking feature that prevents answers to be counted multiple times.
      */
      var artistTrue = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artistTrue"];
      var songTrue = games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["songTrue"];
      
      /*
      This checks every word in the song title or artist with all the words guessed by the player so far. This solution still
      succeeds even if the song repeats words in the artist name or song title, while simply checking array lengths against
      each other does not.
      */
      let allArtistWords = true
      for (var words of songArtistWords) {
        if (!games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"].includes(words)) {
          allArtistWords = false;
        }
      }
      let allTitleWords = true
      for (var words of titleArtistWords) {
        if (!games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"].includes(words)) {
          allTitleWords = false;
        }
      }

      if (allArtistWords) {
        if (artistTrue == false) {
          artistTrue = true;
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artistTrue"] = true;
          games[data.room]["scoreboard"][users.get(socket.id)] += 1;
      }
        }
         
      if (allTitleWords) {
        if (songTrue == false) {
          songTrue = true;
          games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["songTrue"] = true;
          games[data.room]["scoreboard"][users.get(socket.id)] += 1;
      }
      }

      //After the guess has been processed, the info is sent to the client to be displayed in browser.
      io.to(socket.id).emit("unveilGuess", {artist: songArtistWords, guessArtist: games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["artist"], title: titleArtistWords, guessTitle: games[data.room]["scoreboard"]["rounds"][data.round.toString()][users.get(socket.id)]["song"]});
      
      //console.log("Got Artist? " + artistScore);
     // console.log("Got Title? " + titleScore);
     // console.log(artistScore && titleScore);
      
      //This block just checks if a given player is the first to guess both song and artist. If they are, they get an extra point.

      if (artistTrue && songTrue) {
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


// Production listening
 server.listen(process.env.PORT,"0.0.0.0", () => {
   console.log('server running at ' + process.env.PORT);
  });


  //Local hosting
  
 //server.listen(3000, () => {
 // console.log('server running at http://localhost:3000');
  //});

  /*
   * ALL FUNCTIONS ARE STORED UNDER HERE!!!
   * 
   */

  //I found this on stackoverflow somewhere, but I don't remember when. This just returns a promise, which is funny because
  //I believe async functions return promises by default, so this is a little redundant
  async function later(delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}


  //https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array/11935263#11935263

  //Nvm, I re-did this all myself. The purpose of this is to get 10 unique songs from all across the playlist
  //that all feature working preview tracks so the game can work
  async function getRandomSubarray(size) {
    var shuffled = [];
    while (shuffled.length < size) {
      var arr = await getPlaylistData()
      let song = null
      while (song == null) {
        var randomInt = Math.floor(Math.random() * arr.length);
        var randomSong = arr.at(randomInt);
        if (!(shuffled.includes(randomSong))) {
          if (randomSong["preview"] != "") {
            song = randomSong;
          }
        }
      }
      
      shuffled.push(song);
      console.log(shuffled.length);
      console.log(song["preview"]);
    }
    
    return shuffled;
    
    
}


//These functions are for Deezer, which does not have a limit on how their API can be used, like for a game
async function getPlaylistData() {
  var response = await fetch("https://api.deezer.com/playlist/12296469951/", {
        method: 'GET',
      })
    var jsonData = await response.json();
    //Deezer provides 25 tracks per request
    var offset = jsonData["nb_tracks"] - 25 ;
    //var offset = 1007-10;
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    offset = Math.floor(Math.random() * offset);
    //offset = jsonData["nb_tracks"] - 25 ;
    //Requesting twice may seem a little silly, but this allows me to grab the size of the playlist to dynamically allow for greater
    //song ranges so that this plus selecting a random amount of items will provide greater song variation.
    console.log("Offset: " + offset);
    var response = await fetch("https://api.deezer.com/playlist/12296469951/tracks?index="+offset, {
        method: 'GET',
      })
    var jsonData = await response.json();
    //console.log(JSON.stringify(jsonData));
    return await jsonData["data"];
}

/* The following is for Spotify embeds, and according to the spotify terms of service, using the API for a
song game such as this is against the rules, so another solution must be found. Leaving this for posterity. */

  async function getSpotifySongAudio(songId) {
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

  async function getSpotifyPlaylistData(accessToken) {
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

  async function getSpotifyAccessKey() {

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