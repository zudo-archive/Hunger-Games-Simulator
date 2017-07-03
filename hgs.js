/*
 Game state
 */

let gameSettings = {
    "name":"Hunger Games",
    "tributes":[

    ],
    "log":[
     
    ],
    "eventTypes":{
        "fatal":[
            /* 1-player (suicide) */
            {"message":"{0} swallows an ancient scroll which contains an ancient bug curse that eats them from the inside outwards.","count":1,"dead":[0]},
            {"message":"{0} trips over a cliff edge.","count":1,"dead":[0]},
            {"message":"{0} drinks tainted water and dies.","count":1,"dead":[0]},
            {"message":"{0} switched to Hanzo (was Mercy)","count":1,"dead":[0]},
            {"message":"{0} gets voted off the show, and is sniped from a distance.","count":1,"dead":[0]},
            {"message":"The Terminator travels from the future to kill {0}.","count":1,"dead":[0]},
            {"message":"{0} resorts to cannibalism, not realising they are feeding off of themselves.", "count":1, "dead":[0]},

            /* 2-player */
            {"message":"{0} and {1} get into a fight. {0} triumphantly kills {1}.","count":2,"dead":[1]},
            {"message":"{0} and {1} get into a fight. {1} triumphantly kills {0}.","count":2,"dead":[0]},
            {"message":"{0} kills {1} with their own weapon.","count":2,"dead":[1]},
            {"message":"{0} and {1} start fighting. {1} kills {0}, but passes away due to blood loss.","count":2,"dead":[0,1]},
            {"message":"{0} and {1} meet, share resources, start a campfire, ponder deep thoughts before ultimately driving themselves insane and killing themselves.", "count":2, "dead":[0,1]},

            /* 3-player */
            {"message":"{0}, {1} and {2} encounter each other. {0} kills {1}, but is taken down by {2}.","count":3,"dead":[0,1]}
        ],
        "nonFatal":[
            /* 1-player */
            {"message":"{0} ponders their existence.","count":1},

            /* 2-player */
            {"message":"{0} runs into {1} in a clearing. They agree to spare each other for now.", "count":2},

            /* 3-player */

            /* 4-player */
            {"message":"{0}, {1}, {2} and {3} break out into a chorus of \"One Day More\".", "count":4}
        ]
    }
};

let autoSimulate = false;

/*
    Import and export
 */

function gameExport() {
    return btoa(JSON.stringify(gameSettings));
}

function gameImport(settings) {
    return JSON.parse(atob(settings));
}

/*
    String functions
 */

String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
    function () {
        "use strict";
        var str = this.toString();
        if (arguments.length) {
            var t = typeof arguments[0];
            var key;
            var args = ("string" === t || "number" === t) ?
                Array.prototype.slice.call(arguments)
                : arguments[0];

            for (key in args) {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }

        return str;
    };

/*
    Generator functions
 */

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function createTribute(district, male) {
    return {
        "name": "District " + district + " " + (male ? "Male" : "Female"),
        "gender": (male ? "M" : "F"),
        "alive": true,
        "_uuid": uuidv4()
    }
}

/*
    Search and update functions
 */
function findTribute(uuid) {

}

function livingTributes() {
    return gameSettings.tributes.filter(t => t.alive);
}

function randomTributes(n) {
    let living = livingTributes();
    living = living.sort(() => 0.5 - Math.random());
    return living.slice(0, n)
}

function getEvent(fatal)  {
    let list = gameSettings.eventTypes[fatal ? "fatal" : "nonFatal"];
    list = list.filter(e => e.count <= livingTributes().length);
    return list[Math.floor(Math.random()*list.length)];
}

function setTributeAlive(uuid, alive) {
    for (let tributeNum in gameSettings.tributes) {
        if (gameSettings.tributes[tributeNum]._uuid == uuid) {
            gameSettings.tributes[tributeNum].alive = alive;
        }
    }
}

/*
    Debug functions
 */

function disableAutoSave() {
    sessionStorage.setItem("DEBUG_autosave_disabled", true);
}

/*
    Load game
 */

if (sessionStorage.getItem("hgs_game")) {
    gameSettings = gameImport(sessionStorage.getItem("hgs_game"));
} else {
    let male = true;
    for (let i = 0; i < 24; i++) {
        gameSettings.tributes.push(createTribute(Math.floor((i/2)+1), male));
        male = !male;
    }
}

/*
    Save game
 */

window.onbeforeunload = function() {
    if (!sessionStorage.getItem("DEBUG_autosave_disabled")) {
        sessionStorage.setItem("hgs_game", gameExport(gameSettings));
    }
};

/*
    UI
 */

function updateUI() {
    $("#game-name").text(gameSettings.name);

    $("#game-tributes").html("");
    for (let tributeNum in gameSettings.tributes) {
        let tribute = gameSettings.tributes[tributeNum];
        $("#game-tributes").append(`<div class="list-group-item ${tribute.alive ? "list-group-item-success" : "list-group-item-danger"}" id="tribute.${tribute._uuid}">${tribute.name}</div>`);
    }
 
    $("#game-log").html("");
    for (let logID in gameSettings.log) {
        $("#game-log").append(gameSettings.log[logID]);
    }
}

/*
    Game functionality
 */

function loop() {
    if (gameSettings.log.length == 0) {
        gameSettings.log.unshift(`<div class="alert alert-info">Let the games begin!</div>`);
    }
    let fatal = (Math.floor(Math.random()*2) == 1);

    if (livingTributes().length == 1) {
        gameSettings.log.unshift(`<div class="alert alert-info"><strong>${livingTributes()[0].name}</strong> is the winner!</div>`);
        autoSimulate = false;
    } else if (livingTributes().length < 1) {
        gameSettings.log.unshift(`<div class="alert alert-info">The games end with no single winner.</div>`);
        autoSimulate = false;
    } else {
        console.group("Arena Event");

        let event = getEvent(fatal);

        console.log(event);
        let tributesInvolved = randomTributes(event.count);
        let tributesInvolvedText;

        console.log(tributesInvolved);

        tributesInvolvedText = tributesInvolved.map(t => "<strong>" + t.name + "</strong>");

        if (fatal) {
            for (let trib in tributesInvolved) {
                let tribute = tributesInvolved[trib];
                if (event.dead.indexOf(parseInt(trib)) != -1) {
                    setTributeAlive(tribute._uuid, false);
                }
            }
        }

        gameSettings.log.unshift(`<div class="alert ${fatal ? "alert-danger" : "alert-success"}">${event.message.formatUnicorn(tributesInvolvedText)}</div>`);

        console.groupEnd();
    }

    if (autoSimulate) {
        loop();
    } else {
       updateUI();
    }
}

$(function() {
    updateUI();

    $("#game-simulate").click(function() {
        loop();
    });

    $("#game-auto").click(function() {
        autoSimulate = true;
        loop();
    });

    $("#game-reset").click(function() {
       for (let tributeID in gameSettings.tributes) {
           gameSettings.tributes[tributeID].alive = true;
       }
       $("#game-log").html("");
       gameSettings.log = [];
       updateUI();
    });
});
