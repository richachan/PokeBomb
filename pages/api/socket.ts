import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';
import { clear } from 'console';


let userMap = new Map<string,string>() //socket.id, username
let liveMap = new Map<string,number>() //socket.id, lives
let userList = new Array()            //list of socket ids
let currTurn: number = 0;
let timer;
let currLevel: number = 0;
let currentGenerations: number[] = [];

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

//make sure to add conditionals for user answers on palafin-hero
const gen9pokedex = ["Sprigatito", "Floragato", "Meowscarada", "Fuecoco", "Crocalor", "Skeledirge", "Quaxly",
  "Quaxwell", "Quaquaval", "Lechonk", "Oinkologne", "Tarountula", "Spidops", "Nymble", "Lokix", "Tandemaus", 
 "Maushold", "Smoliv", "Dolliv", "Arboliva", "Tadbulb", "Bellibolt", "Capsakid", "Scovillain", "Rellor",
  "Rabsca", "Flittle", "Espathra", "Wiglett", "Wugtrio", "Finizen", "Palafin", "Palafin-hero", "Varoom", 
 "Revavroom", "Orthworm", "Greavard", "Houndstone", "Cetoddle", "Cetitan", "Veluza",
  "Dondozo", "Tatsugiri", "Farigiraf", "Dudunsparce"]

//only return players with lives left
function activePlayers() 
{
  return userList.filter((id) => (liveMap.get(id) ?? 0 > 0)); 
}

function checkGame(io: Server) {
  const active = activePlayers();
  if (active.length === 1) {
    //one player left and wins
    const winnerId = active[0];
    const winnerName = userMap.get(winnerId);
    io.emit('message', { user: winnerName, text: " is the winner!" });
    //new game! everyone has 3 lives again, reset the level to 0
    currLevel = 0;
    userList.forEach((id) => { liveMap.set(id, 3); });
    
    io.emit('players', {
      userMap: Object.fromEntries(userMap),
      currTurn,
      lives: Object.fromEntries(liveMap),
    });
    return true;
  }
  else if (active.length === 0 && userList.length > 0) {
    //no players left
    io.emit('message', { user: 'No one', text: " has won. Restarting..." });
    userList.forEach((id) => { liveMap.set(id, 3); });
    currTurn = 0
    currLevel = 0;
    io.emit('players', {
      userMap: Object.fromEntries(userMap),
      currTurn,
      lives: Object.fromEntries(liveMap),
    });
    return true;
  }
  io.emit('players', {
    userMap: Object.fromEntries(userMap),
    currTurn,
    lives: Object.fromEntries(liveMap),
  });
  return false;
}

function loseLife(socketId: string, io: Server) {
  let old = liveMap.get(socketId) ?? 0;
  liveMap.set(socketId, old - 1); //decrement lives
  //don't forget to emit!
  io.emit('players', {
    userMap: Object.fromEntries(userMap),
    currTurn,
    lives: Object.fromEntries(liveMap),
  });

}

//if there are 2 or more players active ensure the current turn is a valid player, otherwise skip over them


function chooseRandomGeneration() 
{
    let randomGeneration: number;
    if (currentGenerations.length === 0) 
    {
      //If no gens chosen, pick from 1 to 9
      randomGeneration = Math.floor(Math.random() * 9) + 1;
    } 
    else 
    {
      //Otherwise pick from whichever gens are selected
      randomGeneration = currentGenerations[Math.floor(Math.random() * currentGenerations.length)];
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
  
  function getPokemon() 
  {
    const missingNo = Math.floor(Math.random() * 5000);
    if(missingNo === 152)
    {
      return "MissingNo."
    }
    
    const getPokedex = chooseRandomGeneration();
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
  let currentPoke: string;
  let currentPokeAnswer;

  function checkPokemonName()
  {
    currentPoke = getPokemon();
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
  }

  checkPokemonName();
  let currentSprite = getSprite(currentPoke);

  if(currentPoke === "Flabébé")
  {
    currentSprite = getSprite("Flabebe");
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
            if(checkGame(io)) return;
            
            io.emit('players', {
              userMap: Object.fromEntries(userMap),
              currTurn,
              lives: Object.fromEntries(liveMap),
            });
            //check status of game before announcing next turn
            if (checkGame(io)) return;
            msg1 = {
              user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
              text: ""
            };
            io.emit('message', msg1);
  
            //Clear timer
            clearInterval(timer);
  
            //Get next Pokemon
            checkPokemonName();

            if(currentPoke === "Flabébé")
            {
              currentSprite = getSprite("Flabebe");
            }

            currentSprite = getSprite(currentPoke);
            
            io.emit('pokemon', { name: currentPokeAnswer, sprite: currentSprite, guessed: true });
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
          liveMap.set(socket.id, 3);

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
              lives: Object.fromEntries(liveMap),
            });
          }
  
          console.log("Current turn socket ID: " + userList[currTurn]);
  
          io.emit('players', {
            userMap: Object.fromEntries(userMap),
            currTurn,
            lives: Object.fromEntries(liveMap),
          });
  
          io.emit('pokemon', { name: currentPokeAnswer, sprite: currentSprite, guessed: false });
          io.emit('updateGenerations', currentGenerations);
        });

        socket.on('updateGenerations', (gens: number[]) => 
        {
          currentGenerations = gens;
          io.emit('updateGenerations', currentGenerations);
        });
  
        socket.on('newTimer', () => 
        {
          if(timer)
          {
            clearInterval(timer)
          }
          let count = Math.max(15 - currLevel , 3);
          io.emit('setTimer', count);
          if(checkGame(io)) return;
          timer = setInterval(() => {
            count--;
            if (count === 0) 
            {
              //Time ran out
              clearInterval(timer);
              let msg1 = 
              {
                user: userMap.get(userList[currTurn]),
                text: " has failed to guess " + currentPokeAnswer + "!"
              };
              loseLife(userList[currTurn], io);
              //check status of game before announcing next turn
              if(checkGame(io)) return;
              io.emit('message', msg1);
              
              clearInterval(timer);
              //skip over dead players
              do {
                if(currTurn === userList.length - 1)currLevel = currLevel + 1;
                currTurn = (currTurn + 1) % userList.length;
              } while ((liveMap.get(userList[currTurn]) ?? 0) <= 0);
            
              io.emit('players', 
              {
                userMap: Object.fromEntries(userMap),
                currTurn,
                lives: Object.fromEntries(liveMap),
              });
              msg1 = 
              {
                user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
                text: ""
              };
              
              io.emit('message', msg1);
  
              //Shuffle to new Pokémon
              checkPokemonName();
              
              if(currentPoke === "Flabébé")
              {
                  currentSprite = getSprite("Flabebe");
              }

              currentSprite = getSprite(currentPoke);
              io.emit('pokemon', { name: currentPokeAnswer, sprite: currentSprite, guessed: true });
            }
  
            io.emit('setTimer', count);
          }, 1000);
        });
  
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          let index = userList.indexOf(socket.id);
  
          let msg1 = 
          {
            user: userMap.get(socket.id),
            text: " has disconnected "
          };
          io.emit('message', msg1);
  
          userList.splice(index, 1);
          userMap.delete(socket.id);
          liveMap.delete(socket.id);
  
          if (userList.length === 0) {
            //Reset if no players left
            currTurn = 0;
            currLevel = 0;
            io.emit('players', 
            {
              userMap: Object.fromEntries(userMap),
              currTurn,
              lives: Object.fromEntries(liveMap),
            });
            return;
          }
  
          if (currTurn > index) 
          {
            currTurn--;
            io.emit('players', 
            {
              userMap: Object.fromEntries(userMap),
              currTurn,
              lives: Object.fromEntries(liveMap),
            });
          }
          else if (currTurn === index) 
          {
            if(currTurn >= userList.length - 1)currLevel = currLevel + 1;
            currTurn = currTurn % userList.length;
            if(checkGame(io)) return;
            io.emit('players', 
            {
              userMap: Object.fromEntries(userMap),
              currTurn,
              lives: Object.fromEntries(liveMap),
            });
            msg1 = 
            {
              user: "It is now " + userMap.get(userList[currTurn]) + "'s turn to guess!",
              text: ""
            };
            
            io.emit('message', msg1);
  
            //Clear timer
            clearInterval(timer);
        
            io.emit('pokemon', { name: currentPokeAnswer, sprite: currentSprite, guessed: true });
          }
  
          io.emit('players', {
            userMap: Object.fromEntries(userMap),
            currTurn,
            lives: Object.fromEntries(liveMap),
          });
        });
      });
  
      res.socket.server.io = io;
    } else {
      console.log('Socket.IO server already running');
    }
  
    res.end();
  }