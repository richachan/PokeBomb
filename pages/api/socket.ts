import type { NextApiRequest, NextApiResponse } from 'next';
import { get, type Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';
import { clear, time } from 'console';


interface RoomState {
  userMap: Map<string, string>;   
  liveMap: Map<string, number>;     
  userList: string[];               
  currTurn: number;
  //timer for deleting room if no activity (default: 2 min)
  timer?: NodeJS.Timeout;
  currLevel: number;
  currentGenerations: number[];
  gameActive: boolean;
  countdownInterval?: NodeJS.Timeout;
  
  // For Pokémon state:
  currentPoke: string;
  currentPokeAnswer: string;
  currentSprite: string;
}

const rooms: { [roomID: string]: RoomState } = {};

type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};

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

const gen6pokedex = ["Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", 
  "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", 
  "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", 
  "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", 
  "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", 
  "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", 
  "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", 
  "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion"]

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

const gen9pokedex = ["Sprigatito", "Floragato", "Meowscarada", "Fuecoco", "Crocalor", "Skeledirge", "Quaxly",
  "Quaxwell", "Quaquaval", "Lechonk", "Oinkologne", "Tarountula", "Spidops", "Nymble", "Lokix", "Tandemaus", 
 "Maushold", "Smoliv", "Dolliv", "Arboliva", "Tadbulb", "Bellibolt", "Capsakid", "Scovillain", "Rellor",
  "Rabsca", "Flittle", "Espathra", "Wiglett", "Wugtrio", "Finizen", "Palafin", "Palafin-hero", "Varoom", 
 "Revavroom", "Orthworm", "Greavard", "Houndstone", "Cetoddle", "Cetitan", "Veluza",
  "Dondozo", "Tatsugiri", "Farigiraf", "Dudunsparce"]


//only return players with lives left
function activePlayers(room: RoomState): string[] 
{
  return room.userList.filter((id) => (room.liveMap.get(id) ?? 0) > 0);
}

function checkGame(io: Server, room: RoomState, roomID: string): boolean 
{
  const active = activePlayers(room);
  if (active.length === 1) 
  {
    if (room.timer) clearInterval(room.timer);
    //one player left and wins
    const winnerId = active[0];
    const winnerName = room.userMap.get(winnerId);
    io.to(roomID).emit('setTimer', winnerName + " has won the game!");
    io.to(roomID).emit('message', { user: winnerName, text: " is the winner!" });
    io.to(roomID).emit('updateGlobalKey',''); //clear the global input field when game ends
    room.gameActive = false;
    io.emit('gameStatus', { gameActive: room.gameActive });

    return true;
  }
  else if (active.length === 0 && room.userList.length > 0) {
    //no players left
    io.to(roomID).emit('message', { user: 'No one', text: " has won. Restarting..." });
    room.userList.forEach((id) => { room.liveMap.set(id, 3); });
    room.currTurn = 0
    room.currLevel = 0;
    io.emit('players', {
      userMap: Object.fromEntries(room.userMap),
      currTurnL: room.currTurn,
      lives: Object.fromEntries(room.liveMap),
    });
    return true;
  }
  io.to(roomID).emit('players', 
  {
    userMap: Object.fromEntries(room.userMap),
    currTurn: room.currTurn,
    lives: Object.fromEntries(room.liveMap),
  });

  return false;
}

function loseLife(socketId: string, io: Server, room: RoomState, roomID: string) 
{
  let old = room.liveMap.get(socketId) ?? 0;
  room.liveMap.set(socketId, old - 1); //decrement lives
  //don't forget to emit!
  io.to(roomID).emit('players', {
    userMap: Object.fromEntries(room.userMap),
    currTurn: room.currTurn,
    lives: Object.fromEntries(room.liveMap),
  });

}

//if there are 2 or more players active ensure the current turn is a valid player, otherwise skip over them


function chooseRandomGeneration(room: RoomState): string[]
{
    let randomGeneration: number;
    if (room.currentGenerations.length === 0) 
    {
      //If no gens chosen, pick from 1 to 9
      randomGeneration = Math.floor(Math.random() * 9) + 1;
    } 
    else 
    {
      //Otherwise pick from whichever gens are selected
      randomGeneration = room.currentGenerations[Math.floor(Math.random() * room.currentGenerations.length)];
    }
  
    switch (randomGeneration) 
    {
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

  function advanceTurn(io: Server, room: RoomState, roomID: string)
  {
    do 
    {
      if(room.currTurn === room.userList.length - 1)room.currLevel = room.currLevel + 1;
      if(checkGame(io, room, roomID)) return;
      room.currTurn = (room.currTurn + 1) % room.userList.length;
      io.to(room.userMap[room.currTurn]).to(roomID).emit('updateGlobalKey', '');
      
    } while ((room.liveMap.get(room.userList[room.currTurn]) ?? 0) <= 0);
    //Get next Pokemon
    checkPokemonName(room);
    room.currentSprite = getSprite(room.currentPoke);
    
    if(room.currentPoke === "Flabébé")
    {
      room.currentSprite = getSprite("Flabebe");
    }
    
    io.to(roomID).emit('updateGlobalKey','');
    io.to(roomID).emit('pokemon', { name: room.currentPokeAnswer, sprite: room.currentSprite, guessed: true });
  }
  
  function getPokemon(room: RoomState) 
  {
    const missingNo = Math.floor(Math.random() * 5000);
    if(missingNo === 152)
    {
      return "MissingNo."
    }
    
    const getPokedex = chooseRandomGeneration(room);
    const randomIndex = Math.floor(Math.random() * getPokedex.length);
    return getPokedex[randomIndex];
  }
  
  function getSprite(name: string) 
  {
    if(name === "MissingNo.")
    {
      return '/MissingNo.gif'
    }
    return `https://play.pokemonshowdown.com/sprites/xyani/${name.toLowerCase()}.gif`;
  }
  
  //Shuffle the initial Pokémon

  function checkPokemonName(room: RoomState)
  {
    const currentPoke = getPokemon(room);
    let currentPokeAnswer = currentPoke;
    if(currentPoke === "Mrmime") {currentPokeAnswer = "Mr. Mime"}
    else if(currentPoke === "Farfetchd") {currentPokeAnswer = "Farfetch'd"}
    else if(currentPoke === "Porygon2") {currentPokeAnswer = "Porygon-2"}
    else if(currentPoke === "Hooh") {currentPokeAnswer = "Ho-oh"}
    else if(currentPoke === "PorygonZ") {currentPokeAnswer = "Porygon-Z"}
    else if(currentPoke === "Mimejr") {currentPokeAnswer = "Mime Jr."}
    else if(currentPoke === "Flabébé") {currentPokeAnswer = "Flabebe"}
    else if(currentPoke === "Tapulele") {currentPokeAnswer = "Tapu Lele"}
    else if(currentPoke === "Tapukoko") {currentPokeAnswer = "Tapu Koko"}
    else if(currentPoke === "Tapubulu") {currentPokeAnswer = "Tapu Bulu"}
    else if(currentPoke === "Tapufini") {currentPokeAnswer = "Tapu Fini"}
    else if(currentPoke === "Typenull") {currentPokeAnswer = "Type: Null"}
    else if(currentPoke === "Jangmoo") {currentPokeAnswer = "Jangmo-o"}
    else if(currentPoke === "Hakamoo") {currentPokeAnswer = "Hakamo-o"}
    else if(currentPoke === "Kommoo") {currentPokeAnswer = "Kommo-o"}
    else if(currentPoke === "Sirfecthd") {currentPokeAnswer = "Sirfetch'd"} 
    else if(currentPoke === "Mrrime") {currentPokeAnswer = "Mr. Rime"}
    else if(currentPoke === "MissingNo.") {currentPokeAnswer = "MissingNo."}
    else{currentPokeAnswer = currentPoke}
    room.currentPoke = currentPoke;
    room.currentPokeAnswer = currentPokeAnswer;
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
        socket.on('join', ({ username, roomID }) => {
          console.log(`User ${username} joining room ${roomID}. Current rooms:`, Object.keys(rooms));
          if (!rooms[roomID]) {
            console.log(`Room ${roomID} does not exist. Creating new room.`);
            rooms[roomID] = {
              userMap: new Map(),
              liveMap: new Map(),
              userList: [],
              currTurn: 0,
              currLevel: 0,
              currentGenerations: [],
              gameActive: false,
              currentPoke: '',
              currentPokeAnswer: '',
              currentSprite: '',
            };
          } 
          else 
          {
            console.log(`Room ${roomID} already exists.`, rooms[roomID]);
          }
          const room = rooms[roomID];
          socket.join(roomID);
          // Save roomID in socket data for later retrieval
          (socket.data as any).roomID = roomID;
          
          checkPokemonName(room);

          // Register the user in this room
          room.userList.push(socket.id);
          room.userMap.set(socket.id, username);
          room.liveMap.set(socket.id, 0);
          io.to(roomID).emit('message', { user: username, text: " has joined the game!" });
          socket.emit('gameStatus', { gameActive: room.gameActive });
          io.to(roomID).emit('players', {
            userMap: Object.fromEntries(room.userMap),
            currTurn: room.currTurn,
            lives: Object.fromEntries(room.liveMap),
          });
          io.to(roomID).emit('updateGenerations', room.currentGenerations);
          // Optionally, send the current Pokémon (if any)
          io.to(roomID).emit('pokemon', { name: room.currentPokeAnswer, sprite: room.currentSprite, guessed: false });
        });

        socket.on('chat', (msg) => {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];
          const chatMsg = { user: room.userMap.get(socket.id) || '', text: msg.text };
          io.to(roomID).emit('chat', chatMsg);
        });
        
        socket.on('logKey', (message) => {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];
          if (socket.id === room.userList[room.currTurn]) {
            socket.broadcast.to(roomID).emit('updateGlobalKey', message)
          }
        });
        
        socket.on('countdown', () => {  
          const roomID = (socket.data as any).roomID;
          if(!roomID) return; 
          const room = rooms[roomID];
          let time = 4;
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval);
          }
          
          room.countdownInterval = setInterval(() => {
            io.to(roomID).emit('countdownUpdate', time); 
            if (time === 0) { 
              clearInterval(room.countdownInterval);
              io.to(roomID).emit('countdownEnd');
              
          }
          time--;
          }, 1000);
        });

        socket.on('message', (msg) => {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];
          if (room.userList.length === 0) return;
  
          //Compare guess


          if(room.gameActive === true)
          {
            if (socket.id === room.userList[room.currTurn] && msg.text.toLowerCase() === room.currentPokeAnswer.toLowerCase())
            {
              let msg1 = 
              {
                user: room.userMap.get(socket.id),  // Using .get(...) for the Map
                text: " has correctly guessed " + room.currentPokeAnswer + "!"
              };
              io.to(roomID).emit('message', msg1);
    
              //Advance turn
              socket.removeAllListeners('logkey');
              io.to(roomID).emit('updateGlobalKey','');
              advanceTurn(io, room, roomID);

              socket.on('logKey', (message) => {
                socket.broadcast.to(roomID).emit('updateGlobalKey', message)
              });

              if(checkGame(io, room, roomID)) return;

              io.to(roomID).emit('players', 
              {
                userMap: Object.fromEntries(room.userMap),
                currTurn: room.currTurn,
                lives: Object.fromEntries(room.liveMap),
              });

              //check status of game before announcing next turn
              if (checkGame(io, room, roomID)) return;
              msg1 = 
              {
                user: "It is now " + room.userMap.get(room.userList[room.currTurn]) + "'s turn to guess!",
                text: ""
              };
              io.to(roomID).emit('message', msg1);
    
              //Clear timer
              clearInterval(room.timer);
    

            } 
            else if (socket.id === room.userList[room.currTurn]) 
            {
              //Wrong guess
              const msg2 = 
              {
                user: room.userMap.get(socket.id), 
                text: " incorrectly guessed " + msg.text
              };
              io.to(roomID).emit('message', msg2);
            }
          }  
        });
 
        

        socket.on('updateGenerations', (gens: number[]) => 
        {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];
          room.currentGenerations = gens;
          io.to(roomID).emit('updateGenerations', room.currentGenerations);
        });
  
        socket.on('newTimer', () => 
        {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];
          if(room.timer)
          {
            clearInterval(room.timer)
          }
          let count = Math.max(15 - room.currLevel , 5);
          io.to(roomID).emit('setTimer', count);
          if(checkGame(io, room, roomID)) return;
          room.timer = setInterval(() => {
            count--;
            if (count === 0) 
            {
              //Time ran out
              io.to(roomID).emit('setTimer', count);
              clearInterval(room.timer);
              let msg1 = 
              {
                user: room.userMap.get(room.userList[room.currTurn]),
                text: " has failed to guess " + room.currentPokeAnswer + "!"
              };
              io.to(roomID).emit('message', msg1);
              loseLife(room.userList[room.currTurn], io, room, roomID);
              //if timer is 5 seconds or less, set it back to 10 as a cooldown period
              if (room.currLevel >= 10) {
                room.currLevel = 5;
              }
              //check status of game before announcing next turn
              if(checkGame(io, room, roomID)) return;
              clearInterval(room.timer);
              //skip over dead players
              io.to(roomID).emit('updateGlobalKey',''); 
              advanceTurn(io, room, roomID);
              io.to(roomID).emit('updateGlobalKey',''); //clear the global input field
              
              io.to(roomID).emit('players', 
              {
                userMap: Object.fromEntries(room.userMap),
                currTurn: room.currTurn,
                lives: Object.fromEntries(room.liveMap),
              });
              msg1 = 
              {
                user: "It is now " + room.userMap.get(room.userList[room.currTurn]) + "'s turn to guess!",
                text: ""
              };
              
              io.to(roomID).emit('message', msg1);
            }
  
            io.to(roomID).emit('setTimer', count);
          }, 1000);
        });

        socket.on('gameStarted', () =>
        {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];

          if(room.gameActive === false)
          {
            room.gameActive = true;
            io.to(roomID).emit('gameStatus', { gameActive: room.gameActive });
            
            //Clear timer
            clearInterval(room.timer);

            //Get next Pokemon
            checkPokemonName(room);
            
            room.currentSprite = getSprite(room.currentPoke);
            
            if(room.currentPoke === "Flabébé")
            {
              room.currentSprite = getSprite("Flabebe");
            }
                        
            //new game! everyone has 3 lives again, reset the timer level to 0
            room.currLevel = 0;
            room.userList.forEach((id) => { room.liveMap.set(id, 3); });
            io.to(roomID).emit('players', 
            {
              userMap: Object.fromEntries(room.userMap),
              currTurn: room.currTurn,
              lives: Object.fromEntries(room.liveMap),
            });
            io.to(roomID).emit('pokemon', { name: room.currentPokeAnswer, sprite: room.currentSprite, guessed: true });
          }
        });
  
        socket.on('disconnect', () => 
        {
          const roomID = (socket.data as any).roomID;
          if(!roomID) return;
          const room = rooms[roomID];

          console.log('Client disconnected:', socket.id);
          let index = room.userList.indexOf(socket.id);
          
          let msg1 = 
          {
            user: room.userMap.get(socket.id),
            text: " has disconnected "
          };
          io.to(roomID).emit('message', msg1);
  
          room.userList.splice(index, 1);
          room.userMap.delete(socket.id);
          room.liveMap.delete(socket.id);
          
          if (room.userList.length === 0) 
          {
            //because there are rooms now we are
            //deleting the entire room instead of
            //resetting the game
            delete rooms[roomID];
            return;
          }
  
          if (room.currTurn > index) 
          {
            room.currTurn--;
            io.to(roomID).emit('players', 
            {
              userMap: Object.fromEntries(room.userMap),
              currTurn: room.currTurn,
              lives: Object.fromEntries(room.liveMap),
              
            });

            //Generate a new pokemon for incoming player's turn
            checkPokemonName(room);

            room.currentSprite = getSprite(room.currentPoke);
            
            if(room.currentPoke === "Flabébé")
            {
              room.currentSprite = getSprite("Flabebe");
            }
            io.to(roomID).emit('updateGlobalKey','');
            io.to(roomID).emit('pokemon', { name: room.currentPokeAnswer, sprite: room.currentSprite, guessed: true });

          }
          else if (room.currTurn === index) 
          {
            if(room.currTurn >= room.userList.length - 1)room.currLevel = room.currLevel + 1;
            room.currTurn = room.currTurn % room.userList.length;
            if(checkGame(io, room, roomID)) return;
            io.to(roomID).emit('players', 
            {
              userMap: Object.fromEntries(room.userMap),
              currTurn: room.currTurn,
              lives: Object.fromEntries(room.liveMap),
            });
            msg1 = 
            {
              user: "It is now " + room.userMap.get(room.userList[room.currTurn]) + "'s turn to guess!",
              text: ""
            };
            
            io.to(roomID).emit('message', msg1);
  
            //Clear timer
            clearInterval(room.timer);
            
            //Generate a new pokemon for incoming player's turn
            checkPokemonName(room);

           room. currentSprite = getSprite(room.currentPoke);
            
            if(room.currentPoke === "Flabébé")
            {
              room.currentSprite = getSprite("Flabebe");
            }
            io.to(roomID).emit('updateGlobalKey','');
            io.to(roomID).emit('pokemon', { name: room.currentPokeAnswer, sprite: room.currentSprite, guessed: true });
          }
  
          io.to(roomID).emit('players', 
          {
            userMap: Object.fromEntries(room.userMap),
            currTurn: room.currTurn,
            lives: Object.fromEntries(room.liveMap),
          });
        });
      });


  
      res.socket.server.io = io;
    } else {
      console.log('Socket.IO server already running');
    }
  
    res.end();
  }