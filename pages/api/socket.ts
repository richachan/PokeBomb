import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';


let userMap = new Map<string,string>() //socket.id, username
let userList = new Array()            //list of socket ids
let currTurn: number = 0;
let timerId;
let timerList = new Array();
let currentPoke: string;
let currentPokeAnswer: string;
let currentSprite: string;
type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};

//NOTES 
//implement: when the room announces the pokemon name that was unguessed, make it have correct punctuation

//make sure to add conditionals for user answers on mr. mime and farfetch'd
//the correct answer should be based on the pokemon's offical name, so the punctuation should be included
//i.e "mr. mime" is correct, but "Mr Mime" would not be
const gen1pokedex = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", 
  "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", 
  "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", 
  "Nidoran", "Nidorina", "Nidoqueen", "Nidoran", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", 
  "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", 
  "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", 
  "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", 
  "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", 
  "Slowbro", "Magnemite", "Magneton", "Farfetchd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", 
  "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", 
  "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", 
  "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mrmime", 
  "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", 
  "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", 
  "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew"]

// make sure to add conditionals for user answers on ho-oh, porygon-2
const gen2pokedex = ["Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr",
 "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn",
 "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom",
 "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora",
 "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet",
 "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor",
 "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola",
 "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan",
 "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey",
 "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Hooh", "Celebi"]

const gen3pokedex = ["Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", 
  "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", 
  "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", 
  "Ralts", "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", 
  "Nincada", "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", 
  "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", 
  "Manectric", "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", 
  "Wailmer", "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", 
  "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", 
  "Whiscash", "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", 
  "Milotic", "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", 
  "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", 
  "Luvdisc", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", 
  "Latias", "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys"]

// make sure to add conditionals for user answers on porygon-z, mime jr.
const gen4pokedex = ["Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", 
  "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", 
  "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", 
  "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", 
  "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow", "Glameow", "Purugly", 
  "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mimejr", "Happiny", "Chatot", 
  "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon", 
  "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", 
  "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", 
  "Togekiss", "Yanmega", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Porygonz", "Gallade", "Probopass", 
  "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", 
  "Giratina", "Cresselia", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus"]

const gen5pokedex = ["Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", 
  "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage", "Simisage", 
  "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill", "Unfezant", 
  "Blitzle", "Zebstrika", "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur", "Excadrill", 
  "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole", "Palpitoad", "Seismitoad", "Throh", "Sawk", 
  "Sewaddle", "Swadloon", "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott", 
  "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", 
  "Maractus", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", 
  "Carracosta", "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark", "Minccino", "Cinccino", 
  "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", 
  "Vanillish", "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier", "Foongus", 
  "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", 
  "Klink", "Klang", "Klinklang", "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick", 
  "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo", "Beartic", "Cryogonal", "Shelmet", 
  "Accelgor", "Stunfisk", "Mienfoo", "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp", 
  "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor", "Durant", "Deino", "Zweilous", 
  "Hydreigon", "Larvesta", "Volcarona", "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", 
  "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect"]

// make sure to add conditionals for user answers on flabébé
const gen6pokedex = ["Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", 
  "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", 
  "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", 
  "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", 
  "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", 
  "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", 
  "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", 
  "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion"]

// make sure to add conditionals for user answers on tapu lele, tapu koko, tapu bulu, tapu fini, type: null, jangmo-o, hakamo-o, kommo-o
const gen7pokedex = ["Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar", "Popplio", "Brionne", "Primarina", 
  "Pikipek", "Trumbeak", "Toucannon", "Yungoos", "Gumshoos", "Grubbin", "Charjabug", "Vikavolt", "Crabrawler", 
  "Crabominable", "Oricorio", "Cutiefly", "Ribombee", "Rockruff", "Lycanroc", "Wishiwashi", "Mareanie", "Toxapex", 
  "Mudbray", "Mudsdale", "Dewpider", "Araquanid", "Fomantis", "Lurantis", "Morelull", "Shiinotic", "Salandit", 
  "Salazzle", "Stufful", "Bewear", "Bounsweet", "Steenee", "Tsareena", "Comfey", "Oranguru", "Passimian", 
  "Wimpod", "Golisopod", "Sandygast", "Palossand", "Pyukumuku", "Typenull", "Silvally", "Minior", "Komala", 
  "Turtonator", "Togedemaru", "Mimikyu", "Bruxish", "Drampa", "Dhelmise", "Jangmoo", "Hakamoo", "Kommoo", 
  "Tapukoko", "Tapulele", "Tapubulu", "Tapufini", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Nihilego", 
  "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Necrozma", "Magearna", 
  "Marshadow", "Poipole", "Naganadel", "Stakataka", "Blacephalon", "Zeraora", "Meltan", "Melmetal"] 
  

// make sure to add conditionals for user answers on sirfetch'd, mr. rime
const gen8pokedex = ["Grookey", "Thwackey", "Rillaboom", "Scorbunny", "Raboot", "Cinderace", "Sobble", "Drizzile", "Inteleon", 
  "Skwovet", "Greedent", "Rookidee", "Corvisquire", "Corviknight", "Blipbug", "Dottler", "Orbeetle", 
  "Nickit", "Thievul", "Gossifleur", "Eldegoss", "Wooloo", "Dubwool", "Chewtle", "Drednaw", "Yamper", 
  "Boltund", "Rolycoly", "Carkol", "Coalossal", "Applin", "Flapple", "Appletun", "Silicobra", "Sandaconda", 
  "Cramorant", "Arrokuda", "Barraskewda", "Toxel", "Toxtricity", "Sizzlipede", "Centiskorch", "Clobbopus", 
  "Grapploct", "Sinistea", "Polteageist", "Hatenna", "Hattrem", "Hatterene", "Impidimp", "Morgrem", "Grimmsnarl", 
  "Obstagoon", "Perrserker", "Cursola", "Sirfetchd", "Mrrime", "Runerigus", "Milcery", "Alcremie", 
  "Falinks", "Pincurchin", "Snom", "Frosmoth", "Stonjourner", "Eiscue", "Indeedee", "Morpeko", 
  "Cufant", "Copperajah", "Dracozolt", "Arctozolt", "Dracovish", "Arctovish", "Duraludon", "Dreepy", "Drakloak", "Dragapult", 
  "Zacian", "Zamazenta", "Eternatus", "Kubfu", "Urshifu", "Zarude", "Regieleki", "Regidrago", "Glastrier", "Spectrier", 
  "Calyrex"]

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

//make sure to add conditionals for user answers on palafin-hero
const gen9pokedex = ["Sprigatito", "Floragato", "Meowscarada", "Fuecoco", "Crocalor", "Skeledirge", "Quaxly",
  "Quaxwell", "Quaquaval", "Lechonk", "Oinkologne", "Tarountula", "Spidops", "Nymble", "Lokix", "Tandemaus", 
 "Maushold", "Smoliv", "Dolliv", "Arboliva", "Tadbulb", "Bellibolt", "Capsakid", "Scovillain", "Rellor",
  "Rabsca", "Flittle", "Espathra", "Wiglett", "Wugtrio", "Finizen", "Palafin", "Palafin-hero", "Varoom", 
 "Revavroom", "Orthworm", "Greavard", "Houndstone", "Cetoddle", "Cetitan", "Veluza",
  "Dondozo", "Tatsugiri", "Farigiraf", "Dudunsparce"]

  let currentGenerations: number[] = [];

  function chooseRandomGeneration() {
    let randomGeneration: number;
    if (currentGenerations.length === 0) {
      //If no gens chosen, pick from 1 to 9
      randomGeneration = Math.floor(Math.random() * 9) + 1;
    } else {
      //Otherwise pick from whichever gens are selected
      randomGeneration = currentGenerations[Math.floor(Math.random() * currentGenerations.length)];
    }
  
    switch (randomGeneration) {
      case 1: return gen1pokedex;
      case 2: return gen2pokedex;
      case 3: return gen3pokedex;
      case 4: return gen4pokedex;
      case 5: return gen5pokedex;
      case 6: return gen6pokedex;
      case 7: return gen7pokedex;
      case 8: return gen8pokedex;
      case 9: return gen9pokedex;
      default: return gen1pokedex;
    }
  }
  
  function getPokemon() {
    const getPokedex = chooseRandomGeneration();
    const randomIndex = Math.floor(Math.random() * getPokedex.length);
    return getPokedex[randomIndex];
  }
  
  function getSprite(name: string) {
    return `https://play.pokemonshowdown.com/sprites/xyani/${name.toLowerCase()}.gif`;
  }
  
  //shuffle the pokemon and return a random one
  function shufflePokemon()
  {
    currentPoke = getPokemon();
    currentSprite = getSprite(currentPoke);
  
    // Handle special cases for Pokémon with punctuation or specific names
    if (currentPoke === "Mrmime") currentPokeAnswer = "Mr. Mime";
    else if (currentPoke === "Farfetchd") currentPokeAnswer = "Farfetch'd";
    else if (currentPoke === "Porygon2") currentPokeAnswer = "Porygon-2";
    else if (currentPoke === "Hooh") currentPokeAnswer = "Ho-oh";
    else if (currentPoke === "PorygonZ") currentPokeAnswer = "Porygon-Z";
    else if (currentPoke === "Mimejr") currentPokeAnswer = "Mime Jr.";
    else if (currentPoke === "Flabébé") currentPokeAnswer = "Flabebe";
    else if (currentPoke === "Tapulele") currentPokeAnswer = "Tapu Lele";
    else if (currentPoke === "Tapukoko") currentPokeAnswer = "Tapu Koko";
    else if (currentPoke === "Tapubulu") currentPokeAnswer = "Tapu Bulu";
    else if (currentPoke === "Tapufini") currentPokeAnswer = "Tapu Fini";
    else if (currentPoke === "Typenull") currentPokeAnswer = "Type: Null";
    else if (currentPoke === "Jangmoo") currentPokeAnswer = "Jangmo-o";
    else if (currentPoke === "Hakamoo") currentPokeAnswer = "Hakamo-o";
    else if (currentPoke === "Kommoo") currentPokeAnswer = "Kommo-o";
    else if (currentPoke === "Sirfetchd") currentPokeAnswer = "Sirfetch'd";
    else if (currentPoke === "Mrrime") currentPokeAnswer = "Mr. Rime";
    else currentPokeAnswer = currentPoke;
  }
  
  export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
      console.log('Initializing new Socket.IO server...');
      
      const io = new Server(res.socket.server, {
        path: '/api/socket_io',
        cors: {
          origin: '*',
        },
      });
  
      io.on('connection', (socket) => {
        console.log('A client connected:', socket.id);

        socket.on('message', (msg) => {
          if (userList.length === 0) return;
  
          //Compare guess
          if (socket.id === userList[currTurn] && msg.text.toLowerCase() === currentPokeAnswer.toLowerCase()) {
            let msg1 = {
              user: userMap.get(socket.id),  // Using .get(...) for the Map
              text: " has correctly guessed " + currentPokeAnswer + "!"
            };
            io.emit('message', msg1);
  
            //Advance turn
            currTurn = (currTurn + 1) % userList.length;
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
            });
            msg1 = {
              user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
              text: ""
            };
            io.emit('message', msg1);
  
            //Clear timers
            for (const id of timerList) {
              clearInterval(id);
            }
  
            //Get next Pokemon
            shufflePokemon();
            io.emit('pokemon', { name: currentPoke, sprite: currentSprite, guessed: true });
          } 
          else if (socket.id === userList[currTurn]) {
            //Wrong guess
            const msg2 = {
              user: userMap.get(socket.id), 
              text: " incorrectly guessed " + msg.text
            };
            io.emit('message', msg2);
          }
        });
 
        socket.on('register', (userName) => {
          userList.push(socket.id);
          userMap.set(socket.id, userName);
  
          console.log(userMap.get(socket.id) + " has joined the game with client id: " + socket.id);
          let registerMsg = {
            user: userMap.get(socket.id),
            text: " has joined the game!"
          };
          io.emit('message', registerMsg);

          if (userList.length === 1) {
            currTurn = 0;
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
            });
          }
  
          console.log("Current turn socket ID: " + userList[currTurn]);
  
          io.emit('players', {
            userMap: Object.fromEntries(userMap),
            currTurn
          });
  
          io.emit('pokemon', { name: currentPoke, sprite: currentSprite, guessed: false });
          io.emit('updateGenerations', currentGenerations);
        });

        socket.on('updateGenerations', (gens: number[]) => {
          currentGenerations = gens;
          io.emit('updateGenerations', currentGenerations);
        });
  
        socket.on('newTimer', () => {
          let count = 15;
          io.emit('setTimer', count);
  
          timerId = setInterval(() => {
            count--;
            if (count === 0) {
              //Time ran out
              for (const id of timerList) {
                clearInterval(id);
              }
              let msg1 = {
                user: userMap.get(socket.id),
                text: " has failed to guess " + currentPokeAnswer + "!"
              };
              io.emit('message', msg1);
  
              //Advance turn
              currTurn = (currTurn + 1) % userList.length;
              io.emit('players', {
                userMap: Object.fromEntries(userMap),
                currTurn,
              });
              msg1 = {
                user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
                text: ""
              };
              io.emit('message', msg1);
  
              //Shuffle to new Pokémon
              currentPoke = getPokemon();
              currentSprite = getSprite(currentPoke);
              io.emit('pokemon', { name: currentPoke, sprite: currentSprite, guessed: true });
            }
  
            io.emit('setTimer', count);
          }, 1000);
  
          timerList.push(timerId);
        });
  
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          let index = userList.indexOf(socket.id);
  
          let msg1 = {
            user: userMap.get(socket.id),
            text: " has disconnected "
          };
          io.emit('message', msg1);
  
          userList.splice(index, 1);
          userMap.delete(socket.id);
  
          if (userList.length === 0) {
            //Reset if no players left
            currTurn = 0;
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
            });
            return;
          }
  
          if (currTurn > index) {
            currTurn--;
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
            });
          }
          else if (currTurn === index) {
            currTurn = currTurn % userList.length;
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
            });
            msg1 = {
              user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
              text: ""
            };
            io.emit('message', msg1);
  
            //Clear old timers
            for (const id of timerList) {
              clearInterval(id);
            }
            io.emit('pokemon', { name: currentPoke, sprite: currentSprite, guessed: true });
          }
  
          io.emit('players', {
            userMap: Object.fromEntries(userMap),
            currTurn
          });
        });
      });
  
      res.socket.server.io = io;
    } else {
      console.log('Socket.IO server already running');
    }
  
    res.end();
  }