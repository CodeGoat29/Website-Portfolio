(function () {
  'use strict';

  function cards(text) {
    return text.trim().split('\n').filter(Boolean).map(line => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      return match ? { q: Number(match[1]), n: match[2] } : { q: 1, n: line };
    });
  }

  const zombieBoards = {
    mainboard: cards(`Zombie Scarlet Witch
Accursed Duneyard
Adarkar Wastes
Arcane Sanctum
Arcane Signet
Archaeomancer's Map
Blasphemous Edict
Cabal Coffers
Cemetery Reaper
Champion of the Perished
Command Tower
Conqueror's Flail
Corpse Knight
Crowded Crypt
Cryptcaller Chariot
Damn
Deadly Rollick
Death Baron
Despark
Diregraf Captain
Diregraf Colossus
Dolmen Gate
Drowned Catacomb
Empty the Laboratory
Exotic Orchard
Fellwar Stone
Fetid Pools
Field of Ruin
Fierce Guardianship
Forum of Amity
Glacial Fortress
God-Eternal Oketra
Grave Pact
Gravecrawler
Gray Merchant of Asphodel
Hashaton, Scarab's Fist
Herald's Horn
6 Island
Isolated Chapel
Land Tax
Lost Monarch of Ifnir
Mana Drain
Monument to Endurance
Moseo, Vein's New Dean
Necroduality
On Wings of Gold
Patchwork Banner
Path of Ancestry
Phyrexian Altar
5 Plains
Prairie Stream
Ravenous Rotbelly
Reanimate
Reconnaissance
Reliquary Tower
Renewed Solidarity
Rhystic Study
Rise of the Dread Marn
Rooftop Storm
Rot Hulk
Secluded Courtyard
Shadowbringers
Shepherd of Rot
Sol Ring
Splinter's Technique
Sunken Hollow
4 Swamp
Swords to Plowshares
Talisman of Dominance
Talisman of Hierarchy
Teferi's Ageless Insight
Temmet, Naktamun's Will
Temple of Deceit
Undead Hand Ninja
Undead Warchief
Underground River
Unholy Grotto
Unstoppable Slasher
Urborg, Tomb of Yawgmoth
Vault of the Archangel
Victimize
Void Rend
Wand of Orcus
Warren Soultrader
Wayward Servant
Wonder
Zombie Master
Zul Ashur, Lich Lord`),
    sideboard: cards(`Amphibian Downpour
Bloodline Bidding
Call to the Netherworld
Cover of Darkness
Darksteel Mutation
Dying to Serve
El Dorado Sarcophagus
Ellie's Rage
Endless Ranks of the Dead
Entomb
Geralf, Visionary Stitcher
Harmonized Crescendo
Havengul Lich
Imprisoned in the Moon
Lich Lord of Unx
Lively Dirge
Lord of the Accursed
Ratadrabik of Urborg
Stitch Together
Supreme Verdict
Tomb Tyrant
Tomebound Lich
Zombie Apocalypse
Zombie Captain America
Zombie Giant-Man
Zombie Thor`),
    considering: cards(`Awesome Android
Binding Mummy
Blessed Ghoul
Morkrut Behemoth
Siege Zombie
Vengeful Dead
Butcher Ghoul
Corpse Harvester
Foulmire Knight
Corpse Augur
Fleshbag Marauder
Nevinyrral, Urborg Tyrant
Noxious Ghoul
Overcharged Amalgam
Plague Belcher
Shambling Ghast
Valor
Coffin Queen
God-Eternal Kefnet
Geralf, the Fleshwright
Graveborn Muse
Grimgrin, Corpse-Born
Lord of the Undead
Carrion Feeder
Filth
Headless Rider
Ebondeath, Dracolich
The Ghoul, Gunslinger
Hordewing Skaab
Sidisi, Undead Vizier
Relentless Dead
Mikaeus, the Unhallowed
Roaming Throne
Army of the Damned
Supreme Verdict
Patriarch's Bidding
Buried Alive
Rise of the Dark Realms
Winds of Abandon
Kindred Dominance
Windfall
Decorum Dissertation
Living Death
Scheming Symmetry
Bitter Ordeal
Echo of Eons
Praetor's Grasp
Paradoxical Outcome
Holy Day
Frantic Search
Sphinx's Revelation
Village Rites
Unwind
Endwalker
Path to Exile
Reins of Power
Mandate of Peace
Render Silent
An Offer You Can't Refuse
Clever Concealment
Orim's Chant
Dawn's Truce
Akroma's Will
Flawless Maneuver
T'Challa's Protection
Fierce Guardianship
Bag of Holding
Midnight Clock
Nevinyrral's Disk
Library of Leng
Lich's Relic
Wishclaw Talisman
Skybreaker, Sword of Bashenga
Claws of Gix
Bolas's Citadel
Eldrazi Monument
Alhammarret's Archive
Chronicle of Victory
Urza's Incubator
Sensei's Divining Top
Akroma's Memorial
Kindred Boon
King Narfi's Betrayal
Liliana's Mastery
Oversold Cemetery
Feast of Sanity
Imprisoned in the Moon
Reflections of Littjara
Proft's Eidetic Memory
Unstoppable Plan
Mirrormade
Tortured Existence
Kindred Discovery
Necromancy
The Meathook Massacre
Tombstone Stairwell
Witch's Clinic
Maze of Ith
Cabal Coffers
Phyrexian Tower
Three Tree City
Cavern of Souls`)
  };

  window.MTGProfileDecks = {
    updatedAt: '2026-11-14',
    profile: 'https://moxfield.com/users/codegoat29',
    decks: [
      {
        id: 'clavileno',
        name: "Heaven's Gate: All Members Must Ascend - Clavileño, First of the Blessed",
        url: 'https://moxfield.com/decks/u3c9DNw2hUKUeywURgZe8Q',
        boards: {
          mainboard: cards(`Clavileño, First of the Blessed
Arcane Signet
Archaeomancer's Map
Avengers Monitoring Station
Bartolomé del Presidio
Blade of the Bloodchief
Bleachbone Verge
Blood Artist
Bloodghast
Bloodletter of Aclazotz
Bloodline Keeper / Lord of Lineage
Bojuka Bog
Cavern of Souls
Champion of Dusk
Charismatic Conqueror
Command Tower
Concealed Courtyard
Cordial Vampire
Cruel Celebrant
Damn
Darksteel Mutation
Dawn's Truce
Deadly Dispute
Deadly Rollick
Despark
Doom Variant
Edgar, Charmed Groom / Edgar Markov's Coffin
Elenda, the Dusk Rose
Elenda's Hierophant
Exotic Orchard
Exquisite Blood
Fellwar Stone
Forerunner of the Legion
Godless Shrine
High Market
Illusionist's Bracers
Indulgent Aristocrat
Isolated Chapel
Land Tax
Legion Lieutenant
Legion's Landing / Adanto, the First Fort
Liliana's Contract
March of the Canonized
Markov Baron
Marsh Flats
Martyr of Dusk
Master of Dark Rites
Mavren Fein, Dusk Apostle
Mind Stone
Morbid Opportunist
Olivia's Wrath
Orzhov Signet
Patchwork Banner
Path to Exile
8 Plains
Promise of Aclazotz / Foul Rebirth
Redemption Choir
Rogue's Passage
Salt Vampire
Sanctum Seeker
Sanguine Bond
Scheming Silvertongue / Sign in Blood
Secluded Courtyard
Shadowy Backstreet
Shattered Sanctum
Skullclamp
Smothering Tithe
Sol Ring
Sorin, Imperious Bloodlord
Starfleet HQ, Under Assault
9 Swamp
Swords to Plowshares
Tainted Field
Talisman of Hierarchy
Teysa Karlov
Three Tree City
Twilight Prophet
Vampiric Tutor
Vault of Champions
Vault of the Archangel
Viscera Seer
Vito, Thorn of the Dusk Rose
Vona's Hunger
Welcoming Vampire
Yahenni, Undying Partisan`),
          sideboard: cards(`Baron Bertram Graywater
Bastion of Remembrance
Dusk Legion Sergeant
Dusk Legion Zealot
New Blood
Strionic Resonator`),
          considering: cards(`Bloodcrazed Socialite
Gatekeeper of Malakir
Olivia's Dragoon
Sanguine Savior
Skulking Killer
Unholy Officiant
Vampire Interloper
Marauding Blight-Priest
Bloodline Necromancer
Queen's Bay Paladin
Bringer of the Last Gift
Verrak, Warped Sengir
Elas il-Kor, Sadistic Pilgrim
Zulaport Cutthroat
Carrion Feeder
Pitiless Plunderer
Bloodthirsty Conqueror
Toxic Deluge
Blood Tribute
Plumb the Forbidden
Glass-Cast Heart
Anointed Procession`)
        }
      },
      {
        id: 'skullbriar',
        name: 'My Counters are Saved to the Cloud - Skullbriar, the Walking Grave',
        url: 'https://moxfield.com/decks/v4XpqhWtHkeoDX6Gv9wfoA',
        boards: {
          mainboard: cards(`Skullbriar, the Walking Grave
Accursed Duneyard
Aetheric Amplifier
Alchemist's Assistant
Arcane Signet
Bear Umbra
Bojuka Bog
Buried Alive
Canopy Cover
Champion of Dusan
Claim the Kingdom
Command Tower
Commander's Plate
Daring Fiendbonder
Deadly Rollick
Drannith Ruins
Duskfang Mentor
Duskshell Crawler
Entomb
Fangs of Kalonia
Farseek
Fireshrieker
10 Forest
Forge of Heroes
Forgotten Ancient
Fully Grown
Gift of the Viper
Hardened Scales
Haunted Cloak
High Score
Hollowmurk Siege
Homeward Path
Hornbash Mentor
Hunter's Insight
Hydra's Growth
Innkeeper's Talent
Instill Energy
Invigorating Surge
Kami of Whispered Hopes
Karn's Bastion
Kaya's Ghostform
Khalni Ambush / Khalni Territory
Level Up
Leyline Axe
Llanowar Elves
Llanowar Reborn
Llanowar Wastes
Mandate of Abaddon
Minas Morgul, Dark Fortress
Mithril Coat
Necklace of Girion
Necroblossom Snarl
Nesting Grounds
Opal Palace
Oran-Rief, the Vastwood
Ozolith, the Shattered Spire
Power Fist
Predatory Hunger
Prowler's Helm
Qarsi Revenant
Rampant Growth
Rancor
Revitalizing Repast / Old-Growth Grove
Rishkar's Expertise
Rogue's Passage
Scavenged Brawler
Shizo, Death's Storehouse
Slippery Bogbonder
Snake Umbra
Sol Ring
Solidarity of Heroes
Sphere Grid
Study the Classics
3 Swamp
Tainted Wood
Terrasymbiosis
The Earth Crystal
The Ozolith
Thickest in the Thicket
Three Visits
Thriving Grove
Thriving Moor
Titanoth Rex
Trailblazer's Boots
Tyrite Sanctum
Undergrowth Stadium
Visions of Dominance
Well Rested
Woodland Cemetery`),
          sideboard: cards(`Belt of Giant Strength
Branching Evolution
Doubling Season
Dr. Joseph M'Benga
Ferocity of the Hunt
Forced Adaptation
In Search of Greatness
Journey to Eternity / Atzal, Cave of Eternity
Lion Umbra
Loading Zone
Mask of Memory
Myth Unbound
Nature's Lore
One with Nature
Oubliette
Panther Habit
Seismic Tutelage
Sudden Spinnerets
Tainted Strike
Vraska Joins Up
Whispersilk Cloak`),
          considering: cards(`Blood Curdle
Snakeskin Veil
Ring of Kalonia
Ring of Xathrid
Vedalken Orrery
Ordeal of Nylea
Fight Rigging
Raised by Giants
Gardenize
Strong Back`)
        }
      },
      {
        id: 'prospects',
        name: 'Prospect commanders',
        url: 'https://moxfield.com/decks/Hm_yD1yLCkCiHffyIfDCqg',
        boards: {
          mainboard: cards(`Animar, Soul of Elements
Atla Palani, Nest Tender
Baylen, the Haymaker
Elsha of the Infinite
Glarb, Calamity's Augur
Hazezon, Shaper of Sand
Henzie "Toolbox" Torre
Nick Fury, Agent of S.H.I.E.L.D.`),
          sideboard: [],
          considering: []
        }
      },
      { id: 'zombie-scarlet-witch', name: 'The Undead Avengers - Zombie Scarlet Witch', url: 'https://moxfield.com/decks/9iBgtt4OAkip0DL0gyegoQ', boards: zombieBoards },
      {
        id: 'mothman',
        name: 'OnlyMoths: 18+ Rads Only - The Wise Mothman',
        url: 'https://moxfield.com/decks/L6HvOVoq1k6d9QeXd8Ct_w',
        boards: {
          mainboard: cards(`The Wise Mothman
Agatha's Soul Cauldron
Altar of the Brood
An Offer You Can't Refuse
Arcane Signet
Assassin's Trophy
Basking Broodscale
Birds of Paradise
Bloodchief Ascension
Bloom Tender
Bojuka Bog
Boseiju, Who Endures
Breeding Pool
Bridgeworks Battle / Tanglespan Bridgeworks
Buried Ruin
Cankerbloom
Collective Resistance
Command Tower
Danny Pink
Deathcap Glade
Deepmuck Desperado
Disciple of Freyalise / Garden of Freyalise
Drown in the Loch
Evolution Witness
Exotic Orchard
Farseek
Fathom Mage
Fetid Gargantua
Flitterwing Nuisance
3 Forest
Freestrider Lookout
Generous Patron
Glen Elendra Archmage
Hardened Scales
Hedge Maze
Hedge Shredder
Herd Baloth
Herd Heirloom
Heroic Intervention
Hidden Hideout
Hollowmurk Siege
Icetill Explorer
Incubation Druid
Irma, Part-Time Mutant
2 Island
Kami of Whispered Hopes
Kodama of the West Tree
Mariposa Military Base
Memory Erosion
Mindcrank
Mistrise Village
Misty Rainforest
Morphic Pool
Mothman Egg
Muldrotha, the Gravetide
Nature's Lore
Nuclear Fallout
Ouroboroid
Overgrown Tomb
Plaza of Heroes
Polluted Delta
Pollywog Prodigy
Psychic Corrosion
Ray Fillet, Wave Warrior
Rejuvenating Springs
Repulsive Mutation
Retribution of the Ancients
Revitalizing Repast / Old-Growth Grove
Ripples of Potential
Ruin Crab
Sage of Hours
Shifting Woodland
Simic Ascendancy
Six
Sol Ring
Swamp
Swarmyard
Swiftfoot Boots
Syr Konrad, the Grim
Takenuma, Abandoned Mire
Tato Farmer
Terrasymbiosis
The Water Crystal
Three Visits
Toxic Deluge
Undead Alchemist
Undergrowth Stadium
Urza's Saga
Verdant Catacombs
Walking Ballista
Watery Grave
Wave Goodbye
Willbreaker
Willowrush Verge
Winding Constrictor
Yavimaya, Cradle of Growth
Zagoth Triome`),
          sideboard: cards(`Altar of Dementia
Amphibian Downpour
Branching Evolution
Dr. Joseph M'Benga
Glowing One
Imprisoned in the Moon
Infesting Radroach
Jidoor, Aristocratic Capital / Overture
Midnight Clock
Mutational Advantage
Mystic Remora
Spock, Completely Logical
The Earth Crystal
The Master of Lake-town
The Master, Transcendent
Thrummingbird
V.A.T.S.
Vexing Radgull`),
          considering: cards(`Reanimate
Recon Craft Theta
Guardian Project
Ripples of Undeath`)
        }
      },
      {
        id: 'caesar',
        name: "You are Overencumbered With 1/1s - Casar Legion's Emperor",
        url: 'https://moxfield.com/decks/fSOhAW212X6-MJDN1Teecg',
        boards: {
          mainboard: cards(`Caesar, Legion's Emperor
Adeline, Resplendent Cathar
Akroma's Will
All-Out Assault
Anguished Unmaking
Anointed Procession
Arabella, Abandoned Doll
Arcane Signet
Ash Barrens
Bastion of Remembrance
Belladonna Took
Bitterblossom
Braids, Arisen Nightmare
Brimaz, King of Oreskos
Canyon Slough
Cathars' Crusade
Charismatic Conqueror
Chromatic Lantern
Clifftop Retreat
Command Tower
Commissar Severina Raine
Corpse Knight
Desolate Mire
Diabolic Intent
Diamond City
Divine Visitation
Dragonskull Summit
Endless Foot Assault
Enduring Innocence
Evolving Wilds
Fervent Charge
Flare of Fortitude
Garna, Bloodfist of Keld
General's Enforcer
Grand Crescendo
Horn of Gondor
Hour of Reckoning
Isolated Chapel
Isshin, Two Heavens as One
Jadar, Ghoulcaller of Nephalia
Jeska's Will
Kambal, Profiteering Mayor
Keeper of the Accord
Kellogg, Dangerous Mind
Krenko, Tin Street Kingpin
Legion Warboss
Leonin Warleader
Lotho, Corrupt Shirriff
MacCready, Lamplight Mayor
Mana Tithe
Memorial to Glory
Mondrak, Glory Dominus
5 Mountain
Myrel, Shield of Argive
Myriad Landscape
Nomad Outpost
Path of Ancestry
Path to Exile
Phyrexian Arena
Pitiless Plunderer
5 Plains
Purphoros, God of the Forge
Ruinous Ultimatum
Shadowblood Ridge
Skullclamp
Smoldering Marsh
Smothering Tithe
Sol Ring
Spark Rupture
4 Swamp
Sword of the Animist
Swords to Plowshares
Tainted Field
Tainted Peak
Talisman of Conviction
Talisman of Hierarchy
Talisman of Indulgence
Teferi's Protection
Temple of Malice
Temple of Silence
Temple of Triumph
Terramorphic Expanse
V.A.T.S.
Voice of Victory
Warleader's Call
Windbrisk Heights
Windcrag Siege
Zurgo Stormrender
Zurgo, Thunder's Decree`),
          sideboard: cards(`Anim Pakal, Thousandth Moon
Black Market
Bone-Cairn Butcher
Boromir, Warden of the Tower
Darksteel Mutation
Goblin Rabblemaster
Powerbalance`),
          considering: []
        }
      },
      {
        id: 'bumbleflower',
        name: 'PRECON - Peace Offering - Ms. Bumbleflower',
        url: 'https://moxfield.com/decks/GSbizXqL7Eixmx5E82jA6A',
        boards: {
          mainboard: cards(`Ms. Bumbleflower
Adarkar Wastes
An Offer You Can't Refuse
Arcane Signet
Baird, Steward of Argive
Bloodroot Apothecary
Body of Knowledge
Broken Wings
Brushland
Canopy Vista
Chasm Skulker
Coiling Oracle
Command Tower
Communal Brewing
Coveted Jewel
Cultivate
Evolving Wilds
Exotic Orchard
Faeburrow Elder
Farseek
Fellwar Stone
Fisher's Talent
Flooded Grove
4 Forest
Forgotten Ancient
Generous Gift
Ghirapur Orrery
Glacial Fortress
Hinterland Harbor
Hoofprints of the Stag
Illusionist's Gambit
Intellectual Offering
4 Island
Jolly Gerbils
Jolrael, Mwonvuli Recluse
Kalonian Hydra
Kwain, Itinerant Meddler
Long River's Pull
Loran of the Third Path
Managorger Hydra
Mangara, the Diplomat
Martial Impetus
Mind Stone
Mr. Foxglove
Octomancer
Overflowing Basin
Peerless Recycling
Perch Protection
Perplexing Test
4 Plains
Prairie Stream
Promise of Loyalty
Psychosis Crawler
Razorverge Thicket
Realm-Cloaked Giant / Cast Off
Reliquary Tower
Riot Control
Rishkar, Peema Renegade
Rites of Flourishing
Seachrome Coast
Seaside Citadel
Secret Rendezvous
Selvala, Explorer Returned
Simic Ascendancy
Skycloud Expanse
Sol Ring
Sphinx of Enlightenment
Spore Frog
Steelburr Champion
Sungrass Prairie
Sunpetal Grove
Sunscorch Regent
Swiftfoot Boots
Swords to Plowshares
Tamiyo, Field Researcher
Temple of Enlightenment
Temple of Mystery
Temple of Plenty
Tempt with Bunnies
Tempt with Discovery
Tenuous Truce
Terramorphic Expanse
Thought Vessel
Thriving Grove
Thriving Heath
Thriving Isle
Triskaidekaphile
Twenty-Toed Toad
Wear Down
Wizard Class
Yavimaya Coast`),
          sideboard: [],
          considering: []
        }
      }
    ]
  };
})();
