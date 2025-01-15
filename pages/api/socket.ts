import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';


let userMap = new Map<string,string>() //socket.id, username
let userList = new Array()            //list of usernames
let currTurn: number = 0;
let timerId;
let timerList = new Array();
type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};

//NOTES 
//implement: when the room announces the pokemon name that was unguessed, make it have correct punctuation

// make sure to add conditionals for user answers on mr. mime and farfetch'd
// the correct answer should be based on the pokemon's offical name, so the punctuation should be included
// i.e "mr. mime" is correct, but "Mr Mime" would not be
const gen1pokedex = ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "squirtle", "wartortle", "blastoise",
"caterpie", "metapod", "butterfree", "weedle", "kakuna", "beedrill", "pidgey", "pidgeotto", "pidgeot",
"rattata", "raticate", "spearow", "fearow", "ekans", "arbok", "pikachu", "raichu", "sandshrew", "sandslash",
"nidoran", "nidorina", "nidoqueen", "nidoran", "nidorino", "nidoking", "clefairy", "clefable", "vulpix", "ninetales",
"jigglypuff", "wigglytuff", "zubat", "golbat", "oddish", "gloom", "vileplume", "paras", "parasect", "venonat", "venomoth",
"diglett", "dugtrio", "meowth", "persian", "psyduck", "golduck", "mankey", "primeape", "growlithe", "arcanine",
"poliwag", "poliwhirl", "poliwrath", "abra", "kadabra", "alakazam", "machop", "machoke", "machamp", "bellsprout",
"weepinbell", "victreebel", "tentacool", "tentacruel", "geodude", "graveler", "golem", "ponyta", "rapidash", "slowpoke",
"slowbro", "magnemite", "magneton", "farfetchd", "doduo", "dodrio", "seel", "dewgong", "grimer", "muk", "shellder",
"cloyster", "gastly", "haunter", "gengar", "onix", "drowzee", "hypno", "krabby", "kingler", "voltorb", "electrode",
"exeggcute", "exeggutor", "cubone", "marowak", "hitmonlee", "hitmonchan", "lickitung", "koffing", "weezing", "rhyhorn",
"rhydon", "chansey", "tangela", "kangaskhan", "horsea", "seadra", "goldeen", "seaking", "staryu", "starmie", "mrmime",
"scyther", "jynx", "electabuzz", "magmar", "pinsir", "tauros", "magikarp", "gyarados", "lapras", "ditto", "eevee",
"vaporeon", "jolteon", "flareon", "porygon", "omanyte", "omastar", "kabuto", "kabutops", "aerodactyl", "snorlax",
"articuno", "zapdos", "moltres", "dratini", "dragonair", "dragonite", "mewtwo", "mew"]

// make sure to add conditionals for user answers on ho-oh, porygon-2
const gen2pokedex = ["chikorita", "bayleef", "meganium", "cyndaquil", "quilava", "typhlosion", "totodile", "croconaw", "feraligatr",
"sentret", "furret", "hoothoot", "noctowl", "ledyba", "ledian", "spinarak", "ariados", "crobat", "chinchou", "lanturn",
"pichu", "cleffa", "igglybuff", "togepi", "togetic", "natu", "xatu", "mareep", "flaaffy", "ampharos", "bellossom",
"marill", "azumarill", "sudowoodo", "politoed", "hoppip", "skiploom", "jumpluff", "aipom", "sunkern", "sunflora",
"yanma", "wooper", "quagsire", "espeon", "umbreon", "murkrow", "slowking", "misdreavus", "unown", "wobbuffet",
"girafarig", "pineco", "forretress", "dunsparce", "gligar", "steelix", "snubbull", "granbull", "qwilfish", "scizor",
"shuckle", "heracross", "sneasel", "teddiursa", "ursaring", "slugma", "magcargo", "swinub", "piloswine", "corsola",
"remoraid", "octillery", "delibird", "mantine", "skarmory", "houndour", "houndoom", "kingdra", "phanpy", "donphan",
"porygon2", "stantler", "smeargle", "tyrogue", "hitmontop", "smoochum", "elekid", "magby", "miltank", "blissey",
"raikou", "entei", "suicune", "larvitar", "pupitar", "tyranitar", "lugia", "hooh", "celebi"]

// make sure to add conditionals for user answers on porygon-2
const gen3pokedex = ["treecko", "grovyle", "sceptile", "torchic", "combusken", "blaziken", "mudkip", "marshtomp", "swampert",
"poochyena", "mightyena", "zigzagoon", "linoone", "wurmple", "silcoon", "beautifly", "cascoon", "dustox",
"lotad", "lombre", "ludicolo", "seedot", "nuzleaf", "shiftry", "taillow", "swellow", "wingull", "pelipper",
"ralts", "kirlia", "gardevoir", "surskit", "masquerain", "shroomish", "breloom", "slakoth", "vigoroth", "slaking",
"nincada", "ninjask", "shedinja", "whismur", "loudred", "exploud", "makuhita", "hariyama", "azurill", "nosepass",
"skitty", "delcatty", "sableye", "mawile", "aron", "lairon", "aggron", "meditite", "medicham", "electrike",
"manectric", "plusle", "minun", "volbeat", "illumise", "roselia", "gulpin", "swalot", "carvanha", "sharpedo",
"wailmer", "wailord", "numel", "camerupt", "torkoal", "spoink", "grumpig", "spinda", "trapinch", "vibrava",
"flygon", "cacnea", "cacturne", "swablu", "altaria", "zangoose", "seviper", "lunatone", "solrock", "barboach",
"whiscash", "corphish", "crawdaunt", "baltoy", "claydol", "lileep", "cradily", "anorith", "armaldo", "feebas",
"milotic", "castform", "kecleon", "shuppet", "banette", "duskull", "dusclops", "tropius", "chimecho", "absol",
"wynaut", "snorunt", "glalie", "spheal", "sealeo", "walrein", "clamperl", "huntail", "gorebyss", "relicanth",
"luvdisc", "bagon", "shelgon", "salamence", "beldum", "metang", "metagross", "regirock", "regice", "registeel",
"latias", "latios", "kyogre", "groudon", "rayquaza", "jirachi", "deoxys"]

// make sure to add conditionals for user answers on porygon-z, mime jr.
const gen4pokedex = ["turtwig", "grotle", "torterra", "chimchar", "monferno", "infernape", "piplup", "prinplup", "empoleon",
"starly", "staravia", "staraptor", "bidoof", "bibarel", "kricketot", "kricketune", "shinx", "luxio", "luxray",
"budew", "roserade", "cranidos", "rampardos", "shieldon", "bastiodon", "burmy", "wormadam", "mothim",
"combee", "vespiquen", "pachirisu", "buizel", "floatzel", "cherubi", "cherrim", "shellos", "gastrodon",
"ambipom", "drifloon", "drifblim", "buneary", "lopunny", "mismagius", "honchkrow", "glameow", "purugly",
"chingling", "stunky", "skuntank", "bronzor", "bronzong", "bonsly", "mimejr", "happiny", "chatot",
"spiritomb", "gible", "gabite", "garchomp", "munchlax", "riolu", "lucario", "hippopotas", "hippowdon",
"skorupi", "drapion", "croagunk", "toxicroak", "carnivine", "finneon", "lumineon", "mantyke", "snover",
"abomasnow", "weavile", "magnezone", "lickilicky", "rhyperior", "tangrowth", "electivire", "magmortar",
"togekiss", "yanmega", "leafeon", "glaceon", "gliscor", "mamoswine", "porygonz", "gallade", "probopass",
"dusknoir", "froslass", "rotom", "uxie", "mesprit", "azelf", "dialga", "palkia", "heatran", "regigigas",
"giratina", "cresselia", "phione", "manaphy", "darkrai", "shaymin", "arceus"]

const gen5pokedex = ["victini", "snivy", "servine", "serperior", "tepig", "pignite", "emboar", "oshawott", "dewott", 
"samurott", "patrat", "watchog", "lillipup", "herdier", "stoutland", "purrloin", "liepard", "pansage", "simisage",
"pansear", "simisear", "panpour", "simipour", "munna", "musharna", "pidove", "tranquill", "unfezant",
"blitzle", "zebstrika", "roggenrola", "boldore", "gigalith", "woobat", "swoobat", "drilbur", "excadrill",
"audino", "timburr", "gurdurr", "conkeldurr", "tympole", "palpitoad", "seismitoad", "throh", "sawk",
"sewaddle", "swadloon", "leavanny", "venipede", "whirlipede", "scolipede", "cottonee", "whimsicott",
"petilil", "lilligant", "basculin", "sandile", "krokorok", "krookodile", "darumaka", "darmanitan",
"maractus", "dwebble", "crustle", "scraggy", "scrafty", "sigilyph", "yamask", "cofagrigus", "tirtouga",
"carracosta", "archen", "archeops", "trubbish", "garbodor", "zorua", "zoroark", "minccino", "cinccino",
"gothita", "gothorita", "gothitelle", "solosis", "duosion", "reuniclus", "ducklett", "swanna", "vanillite",
"vanillish", "vanilluxe", "deerling", "sawsbuck", "emolga", "karrablast", "escavalier", "foongus",
"amoonguss", "frillish", "jellicent", "alomomola", "joltik", "galvantula", "ferroseed", "ferrothorn",
"klink", "klang", "klinklang", "tynamo", "eelektrik", "eelektross", "elgyem", "beheeyem", "litwick",
"lampent", "chandelure", "axew", "fraxure", "haxorus", "cubchoo", "beartic", "cryogonal", "shelmet",
"accelgor", "stunfisk", "mienfoo", "mienshao", "druddigon", "golett", "golurk", "pawniard", "bisharp",
"bouffalant", "rufflet", "braviary", "vullaby", "mandibuzz", "heatmor", "durant", "deino", "zweilous",
"hydreigon", "larvesta", "volcarona", "cobalion", "terrakion", "virizion", "tornadus", "thundurus",
"reshiram", "zekrom", "landorus", "kyurem", "keldeo", "meloetta", "genesect"]

// make sure to add conditionals for user answers on flabébé
const gen6pokedex = ["chespin", "quilladin", "chesnaught", "fennekin", "braixen", "delphox", "froakie", "frogadier", "greninja",
"bunnelby", "diggersby", "fletchling", "fletchinder", "talonflame", "scatterbug", "spewpa", "vivillon",
"litleo", "pyroar", "flabebe", "floette", "florges", "skiddo", "gogoat", "pancham", "pangoro", "furfrou",
"espurr", "meowstic", "honedge", "doublade", "aegislash", "spritzee", "aromatisse", "swirlix", "slurpuff",
"inkay", "malamar", "binacle", "barbaracle", "skrelp", "dragalge", "clauncher", "clawitzer", "helioptile",
"heliolisk", "tyrunt", "tyrantrum", "amaura", "aurorus", "sylveon", "hawlucha", "dedenne", "carbink",
"goomy", "sliggoo", "goodra", "klefki", "phantump", "trevenant", "pumpkaboo", "gourgeist", "bergmite",
"avalugg", "noibat", "noivern", "xerneas", "yveltal", "zygarde", "diancie", "hoopa", "volcanion"]

// make sure to add conditionals for user answers on tapu lele, tapu koko, tapu bulu, tapu fini, type: null, jangmo-o, hakamo-o, kommo-o
const gen7pokedex = ["rowlet", "dartrix", "decidueye", "litten", "torracat", "incineroar", "popplio", "brionne", "primarina",
"pikipek", "trumbeak", "toucannon", "yungoos", "gumshoos", "grubbin", "charjabug", "vikavolt", "crabrawler",
"crabominable", "oricorio", "cutiefly", "ribombee", "rockruff", "lycanroc", "wishiwashi", "mareanie", "toxapex",
"mudbray", "mudsdale", "dewpider", "araquanid", "fomantis", "lurantis", "morelull", "shiinotic", "salandit",
"salazzle", "stufful", "bewear", "bounsweet", "steenee", "tsareena", "comfey", "oranguru", "passimian",
"wimpod", "golisopod", "sandygast", "palossand", "pyukumuku", "typenull", "silvally", "minior", "komala",
"turtonator", "togedemaru", "mimikyu", "bruxish", "drampa", "dhelmise", "jangmoo", "hakamoo", "kommoo",
"tapukoko", "tapulele", "tapubulu", "tapufini", "cosmog", "cosmoem", "solgaleo", "lunala", "nihilego",
"buzzwole", "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord", "necrozma", "magearna",
"marshadow", "poipole", "naganadel", "stakataka", "blacephalon", "zeraora", "meltan", "melmetal"]

// make sure to add conditionals for user answers on sirfetch'd, mr. rime
const gen8pokedex = ["grookey", "thwackey", "rillaboom", "scorbunny", "raboot", "cinderace", "sobble", "drizzile", "inteleon",
"skwovet", "greedent", "rookidee", "corvisquire", "corviknight", "blipbug", "dottler", "orbeetle",
"nickit", "thievul", "gossifleur", "eldegoss", "wooloo", "dubwool", "chewtle", "drednaw", "yamper",
"boltund", "rolycoly", "carkol", "coalossal", "applin", "flapple", "appletun", "silicobra", "sandaconda",
"cramorant", "arrokuda", "barraskewda", "toxel", "toxtricity", "sizzlipede", "centiskorch", "clobbopus",
"grapploct", "sinistea", "polteageist", "hatenna", "hattrem", "hatterene", "impidimp", "morgrem", "grimmsnarl",
"obstagoon", "perrserker", "cursola", "sirfetchd", "mrrime", "runerigus", "milcery", "alcremie",
"falinks", "pincurchin", "snom", "frosmoth", "stonjourner", "eiscue", "indeedee", "morpeko",
"cufant", "copperajah", "dracozolt", "arctozolt", "dracovish", "arctovish", "duraludon", "dreepy", "drakloak", "dragapult",
"zacian", "zamazenta", "eternatus", "kubfu", "urshifu", "zarude", "regieleki", "regidrago", "glastrier", "spectrier",
"calyrex"]

//ALL THESE POKEMON DON'T HAVE A GIF, SO THEY ARE NOT INCLUDED
//wo-chien, chien-pao, ting-lu, chi-yu, roaring moon, iron valient, koraidon, miraidon, walking wake, 
//iron leaves, brune bonnet, flutter mane, slither wing, sandy shocks, iron hands, iron streads, iron bundle,
//iron jugulis, iron moth, iron thorns, great tusk, toedscruel, gholdengo, iron leaves, great tusk, kingambit,
//pawmi, pawmo, pawmot, fidough, dachsbun, squawkabilly, nacli, naclstack, garganacl, charcadet, armarouge
//ceruledge, wattrel, kilowattrel, shroodle, grafaiai, bramblin, brambleghast, toedscool, klawf, tinkatink, 
//tinkatuff, tinkaton, bombirdier, cyclizar, glimmet, glimmora, flamigo, annihilape, clodsire, frigibax,
//arctibax, baxcalibur, gimmighoul, walking wake, dipplin, poltchageist, sinistcha, okidogi, munkidori,
//fezandipiti, ogerpon, archaludon, hydrapple, gouging fire, raging bolt, iron boulder, iron crown, 
//iron crown, terapagos, pecharunt

// make sure to add conditionals for user answers on palafin-hero
const gen9pokedex = ["sprigatito", "floragato", "meowscarada", "fuecoco", "crocalor", "skeledirge", "quaxly", 
  "quaxwell", "quaquaval", "lechonk", "oinkologne", "tarountula", "spidops", "nymble", "lokix", "tandemaus", 
  "maushold", "smoliv", "dolliv", "arboliva", "tadbulb", "bellibolt", "klawf", "capsakid", "scovillain", "rellor", 
  "rabsca", "flittle", "espathra", "wiglett", "wugtrio", "finizen", "palafin", "palafin-hero", "varoom", 
  "revavroom", "orthworm", "greavard", "houndstone", "cetoddle", "cetitan", "veluza",
  "dondozo", "tatsugiri", "farigiraf", "dudunsparce"]

let currentGenerations: number[] = []

function chooseRandomGeneration() 
{
  let randomGeneration: number
  if(currentGenerations.length === 0)
  {
    randomGeneration = Math.floor(Math.random() * 9) + 1;
  }
  else
  {
    randomGeneration = currentGenerations[Math.floor(Math.random() * currentGenerations.length)];
  }

  switch(randomGeneration)
  {
    case 1:{return gen1pokedex;}
    case 2:{return gen2pokedex;}
    case 3:{return gen3pokedex;}
    case 4:{return gen4pokedex;}
    case 5:{return gen5pokedex;}
    case 6:{return gen6pokedex;}
    case 7:{return gen7pokedex;}
    case 8:{return gen8pokedex;}
    case 9:{return gen9pokedex;}
    default: {return gen1pokedex;}
  }
}


function getPokemon()
{
  const getPokedex = chooseRandomGeneration();
  const randomIndex = Math.floor(Math.random() * getPokedex.length);
  return getPokedex[randomIndex]; //returns random pokemon from pokedex list
}

//gets the sprite based on pokemon name from pokemonshowdown api
function getSprite(name: string) 
{
  return `https://play.pokemonshowdown.com/sprites/xyani/${name.toLowerCase()}.gif`;
}

let currentPoke = getPokemon()
let currentSprite = getSprite(currentPoke)

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) 
{
  // If Socket.IO server is not set up yet, set it up
  if (!res.socket.server.io) {
    console.log('Initializing new Socket.IO server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket_io', // optional path
      cors: {
        origin: '*',
      },
    });

    io.on('connection', (socket) => {
      console.log('A client connected:', socket.id);

      socket.on('message', (msg) => {
        if(userList.length == 0){
          return;
        }

        if(socket.id == userList[currTurn] && msg.text.toLowerCase() == currentPoke){
          let msg1 = {user: userMap[socket.id], text:" has correctly guessed " + currentPoke + "!"};
          io.emit('message', msg1);
          currTurn = (currTurn + 1) % userList.length; 
          msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
          io.emit('message', msg1);
          clearInterval(timerId); 

          //shuffle the pokemon and sprite and send to room.tsx (frontend)
          currentPoke = getPokemon();
          currentSprite = getSprite(currentPoke);
          io.emit('pokemon', { name: currentPoke, sprite: currentSprite, guessed:true});
        }
        else if (socket.id == userList[currTurn]) 
        {
          const msg2 = {user: userMap[socket.id], text: " incorrectly guessed " + msg.text};
          io.emit('message', msg2);
        }
      });

      socket.on('register', (userName) => {
        userList.push(socket.id);  
        userMap[socket.id] = userName;       

        console.log(userMap[socket.id] + " has joined the game with client id: " + socket.id);
        let registerMsg = {user: userMap[socket.id], text:" has joined the game!"};
        io.emit('message', registerMsg);
        if (userList.length == 1) {
          currTurn = 0;
        }

        console.log("Current turn " + userList[currTurn]);

        //emit for the client everytime they first join because they won't see what already connected players are seeing
        io.emit('pokemon', { name: currentPoke, sprite: currentSprite,guessed:false });

        //emit what generations are currently selected whenever a client first joins
        io.emit('updateGenerations', currentGenerations);
      });

      socket.on('updateGenerations', (gens: number[]) =>
      {
        currentGenerations = gens
        io.emit('updateGenerations', currentGenerations)
      });

      socket.on('newTimer', () =>{
        let count = 15;
        io.emit('setTimer',count);
        timerId = setInterval(() => { 
          count--;
          if(count == 0){
            clearInterval(timerId)
            let msg1 = {user: userMap[socket.id], text:" has failed to guess " + currentPoke + "!"};
            io.emit('message', msg1);
            currTurn = (currTurn + 1) % userList.length; 
            msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
            io.emit('message', msg1); 

            //shuffle the pokemon and sprite and send to room.tsx (frontend)
            currentPoke = getPokemon();
            currentSprite = getSprite(currentPoke);
            io.emit('pokemon', { name: currentPoke, sprite: currentSprite ,guessed: true});
          }
          io.emit('setTimer',count);
        }
        , 1000);
        timerList.push(timerId);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        let index = userList.indexOf(socket.id)
        let msg1 = {user: userMap[socket.id], text:" has disconnected "};
        io.emit('message', msg1);
        userList.splice(userList.indexOf(socket.id),1)
        userMap.delete(socket.id)
        if (userList.length === 0) {
          // Reset the game state when no players are left
          currTurn = 0;
          return;
        }
        const keysArray = Array.from(userMap.keys());
        console.log(keysArray); 
        if(currTurn > index)currTurn--  // 3 
        else if ( currTurn == index){
          currTurn = currTurn % userList.length
          msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
          io.emit('message', msg1); 
          for(var id of timerList)clearInterval(id);
          io.emit('pokemon', { name: currentPoke, sprite: currentSprite ,guessed: true});
        }
      });
    });

    // Attach the Socket.IO server to the Next.js socket server
    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }

  // We must end the response so Next.js can finish the API route
  res.end();
}
