
var socket = io({autoConnect: false});

socket.on("connect", () => {
	console.log("Connected");
});

socket.on("roomjoin", (data)=> {
    console.log(data);
    var element = document.getElementById("openingPage");
    element.style.display = "none";
    element = document.getElementById("startScreen");
    element.style.display = "block";
    document.getElementById("roomName").innerText = data.roomName;
    document.getElementById("memberList").innerHTML = "";
    for (const peeps of data.users) {
        const item = document.createElement('li');
        item.textContent = peeps;
        document.getElementById("memberList").appendChild(item);
    }
    //document.getElementById("memberList").
});

socket.on("roundStart", (data)=> {
    console.log(JSON.stringify(data));
    var element = document.getElementById("openingPage");
    element.style.display = "none";
    element = document.getElementById("startScreen");
    element.style.display = "none";
    element = document.getElementById("gameScreen");
    element.style.display = "block";

    document.getElementById("sillyTitle").innerText = data.room; //+ " round: " + data.round;
    document.getElementById("sillyRound").innerText = "round: " + data.round;

    document.getElementById("artistName").style.visibility = "hidden";
    document.getElementById("songName").style.visibility = "hidden";

    document.getElementById("artistName").innerText = "";
    document.getElementById("songName").innerText = "";

    var scoreboard = document.getElementById("scoreList");
    scoreboard.innerHTML = "";
    for (var peeps of Object.keys(data.scoreboard)) {
        if (peeps != "rounds") {
        const item = document.createElement('li');
        item.textContent = peeps + ": " + (data.scoreboard[peeps]).toString();
        console.log(item.textContent);
       scoreboard.appendChild(item);
        }
    }

    var audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = data.audio;
    audioPlayer.volume = 0.5;
    audioPlayer.load();
    audioPlayer.play();
});

socket.on("scoreUpdate", (data)=> {
    var scoreboard = document.getElementById("scoreList");
    scoreboard.innerHTML = "";
    for (var peeps of Object.keys(data.scoreboard)) {
        if (peeps != "rounds") {
        const item = document.createElement('li');
        item.textContent = peeps + ": " + (data.scoreboard[peeps]).toString();
        console.log(item.textContent);
       scoreboard.appendChild(item);
        }
    }
});

socket.on("unveilGuess", (data)=> {
    //artist, guessArtist, title, guessTitle

    document.getElementById("artistName").innerText = "";
    document.getElementById("songName").innerText = ""; 

    for (var artistWords of data.artist) {
        var item = document.createElement("span");
        item.textContent = artistWords + " ";
        if (data.guessArtist.includes(artistWords)) {
            item.style.visibility = "visible";
        }
        else {
            item.style.visibility = "hidden";
        }
        document.getElementById("artistName").appendChild(item);
    }
    for (var titleWords of data.title) {
        var item = document.createElement("span");
        item.textContent = titleWords + " ";
        if (data.guessTitle.includes(titleWords)) {
            item.style.visibility = "visible";
        }
        else {
            item.style.visibility = "hidden";
        }
        document.getElementById("songName").appendChild(item);
    }
    



    

});

socket.on("timer", (data)=> {
    document.getElementById("timer").innerText = data.time;
});

socket.on("reset", (data)=> {
    var element = document.getElementById("openingPage");
    element.style.display = "block";
    element = document.getElementById("startScreen");
    element.style.display = "none";
    element = document.getElementById("gameScreen");
    element.style.display = "none";
});

const form = document.getElementById('form');
var username = document.getElementById('username');
var joinRoomName = document.getElementById("joinRoom");
var createRoomName = document.getElementById("createRoom");

document.getElementById("joinButton").onclick = function(){joinRoom()};
document.getElementById("createButton").onclick = function(){createRoom()};
document.getElementById("startGame").onclick = function(){startGame()};

var guessForm = document.getElementById("guessForm");
var userInput = document.getElementById("userInput");

guessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (userInput.value) {
      //socket.emit('chat message', input.value);
      socket.emit("processAnswers", {room: document.getElementById("sillyTitle").innerText, round: document.getElementById("sillyRound").innerText.split(" ")[1], answer: userInput.value})
      console.log(userInput.value);
      userInput.value = '';
    }

});

function joinRoom() {
    
    var joinRoom = joinRoomName.value;
    socket.connect();
    socket.emit("room", {user: username.value, room: joinRoom});
    
    
    //socket.emit("hello", username.value);
}

function createRoom() {
    
    var createRoom = createRoomName.value;
    socket.connect();
    socket.emit("room", {user: username.value, room: createRoom});
}

function startGame() {
    socket.emit("startGame", {room: document.getElementById("roomName").innerText});
}


/*var joinButton = document.getElementById("joinButton");
joinButton.addEventListener("click", joinRoom());

var createButton = document.getElementById("createButton");
createButton.addEventListener("click", createRoom());
*/

//This should hopefully prevent the form submitting
/*form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    });
*/


