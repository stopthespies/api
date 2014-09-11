// deps
var app = require('express.io')();
var cors = require('cors');
var mongo = require(__dirname + '/lib/database');
var config = require(__dirname + '/_config_');
var  _ = require('lodash');
var bodyParser = require('body-parser');

// request handlers
var log = require(__dirname + '/routes/log');
var tweets = require(__dirname + '/routes/tweets');
var stats = require(__dirname + '/routes/stats');
var email = require(__dirname + '/routes/email');
var websites = require(__dirname + '/routes/websites');

// io event broadcasters
var logBroadcaster = require(__dirname + '/routes/broadcast/logs');

//------------------------------------------------------------------------------

app.use(cors());
app.use(bodyParser.json())
app.http().io();

mongo.get().then(function(db) {
	//--------------------------------------------------------------------------
	// standard routes

	// index has some links
    app.get('/', function(req, res) {
        res.send('<h3>StopTheSpies API server</h3> \
        		<a href="https://stopthespies.org">https://stopthespies.org</a> \
        		<a href="https://github.com/stopthespies/">https://github.com/stopthespies/</a>');
    });

    app.get('/battleforthenet', function(req, response) {
	    db.collection('tweets').find({}, {sort : [["user.followers_count", 'desc']], limit : 400}, function(err, res) {
			if (err) {
				callback(err);
				return;
			}
			res.toArray(function(err, docs) {
				if (err) {
					callback(err);
					return;
				}
				var tweets = docs;
		        var tweets = docs.map(function(tweet){
		        	return {
						tweet: tweet.text,
						handle: tweet.user.screen_name,
						name: tweet.user.name,
						avatar: tweet.user.profile_image_url,
						link: 'https://twitter.com/#!/' + tweet.user.screen_name + '/status/' + (tweet.id_str || 'broken') + '/',
						retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + (tweet.id_str|| 'broken'),
						followers: tweet.user.followers_count
		        	}
		        });
		        tweets = _.uniq(tweets, 'handle');
		        response.send(tweets);
			});
		});
    })
    app.get('/battleforthenet.html', function(req, response) {
	    db.collection('tweets').find({}, {sort : [["user.followers_count", 'desc']], limit : 400}, function(err, res) {
			if (err) {
				callback(err);
				return;
			}
			res.toArray(function(err, docs) {
				if (err) {
					callback(err);
					return;
				}
				var tweets = docs;
		        var tweets = docs.map(function(tweet){
		        	return {
						tweet: tweet.text,
						handle: tweet.user.screen_name,
						name: tweet.user.name,
						avatar: tweet.user.profile_image_url,
						link: 'https://twitter.com/#!/' + tweet.user.screen_name + '/status/' + (tweet.id_str || 'broken') + '/',
						retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + (tweet.id_str|| 'broken'),
						followers: tweet.user.followers_count
		        	}
		        });
		        var html = "<table><tbody>";
		        tweets = _.uniq(tweets, 'handle');
		        _.each(tweets, function(tweet){
		        	html += '<tr><td><img src="'+tweet.avatar + '" /></td><td>' + tweet.handle + '</td><td>' + tweet.name + '</td><td>' + tweet.followers + '</td><td>'+ tweet.tweet + '</td></tr>';
		        });


		        html += "</tbody></table>";
		        response.send(html);

			});
		});
    var repHandles = "Robert_Aderholt,SenAlexander,RepJustinAmash,KellyAyotte,MarkAmodeiNV2,BachusAL06,RepJoeBarton,RepBecerra,SanfordBishop,BlumenauerMedia,RoyBlunt,SpeakerBoehner,SenatorBoxer,RepKevinBrady,RepCorrineBrown,SenSherrodBrown,SenatorBurr,RepBrady,SenatorBaldwin,JohnBoozman,TimBishopNY,MarshaBlackburn,MichaelCBurgess,RepRobBishop,GKButterfield,RepJohnBarrow,RepBoustany,MicheleBachmann,RepGusBilirakis,BruceBraley,VernBuchanan,SenJohnBarrasso,RepPaulBrounMD,SenatorBegich,SenBennetCo,RepLouBarletta,RepKarenBass,CongressmanDan,RepDianeBlack,RepMoBrooks,RepLarryBucshon,SenBlumenthal,RepBonamici,RepRonBarber,RepKerryB,RepBeatty,RepAndyBarr,RepJBridenstine,SusanWBrooks,JuliaBrownley26,RepCheri,RepBera,SenBookerOfc,RepByrne,KenCalvert,RepDaveCamp,CantwellPress,SenatorCardin,SenatorCarper,RepSteveChabot,SaxbyChambliss,DelegateDonna,Clyburn,SenDanCoats,HowardCoble,TomCoburn,SenThadCochran,RepJohnConyers,RepJimCooper,MikeCrapo,RepCummings,SenatorCollins,RepLoisCapps,RepJoeCrowley,AnderCrenshaw,GOPLeader,RepShelley,CongCulberson,JudgeCarter,TomColeOK04,JohnCornyn,RepJimCosta,RepCleaver,ConawayTX11,RepCuellar,RepJohnCampbell,USRepKCastor,YvetteClarke,RepCohen,RepJoeCourtney,SenBobCasey,SenBobCorker,RepAndreCarson,JasonInTheHouse,RepMikeCoffman,GerryConnolly,RepJudyChu,JohnCarneyde,RepCicilline,RepRickCrawford,SenCoonsOffice,RepCartwright,JoaquinCastrotx,RepChrisCollins,RepDougCollins,RepPaulCook,RepTomCotton,RepKevinCramer,RepCardenas,SenTedCruz,RepKClark,RepDannyDavis,RepPeterDeFazio,RepDianaDeGette,RosaDeLauro,John_Dingell,RepLloydDoggett,USRepMikeDoyle,RepJohnDuncanJr,SenatorDurbin,RepSusanDavis,MarioDB,SenDonnelly,RepTedDeutch,RepJeffDenham,RepSeanDuffy,RepJeffDuncan,DesJarlaisTN04,RepDelBene,SteveDaines,RodneyDavis,RepJohnDelaney,RepDeSantis,RepDuckworth,RepEliotEngel,RepAnnaEshoo,SenatorEnzi,KeithEllison,RepDonnaEdwards,RepReneeEllmers,RepBillEnyart,RepEsty,EFaleomavaega,RepSamFarr,ChakaFattah,SenFeinstein,USRepRodney,JeffFlake,Randy_Forbes,RepTrentFranks,JeffFortenberry,VirginiaFoxx,RepFitzpatrick,RepBillFoster,RepMarciaFudge,RepFleming,RepFincherTN08,RepChuck,Farenthold,RepBillFlores,RepLoisFrankel,SenatorFischer,RepGoodlatte,GrahamBlog,RepKayGranger,ChuckGrassley,RepGeneGreen,LuisGutierrez,RepGarrett,JimGerlach,RepPhilGingrey,RepraulGrijalva,RepLouieGohmert,RepAlGreen,RepGuthrie,RepGaramendi,RepTomGraves,RepCoryGardner,RepBobGibbs,RepChrisGibson,RepGosar,TGowdySC,RepTimGriffin,RepMGriffith,RepMichaelGrimm,TulsiPress,RepPeteGallego,RepJoeGarcia,RalphHallPress,SenatorHarkin,RepHastingsFL,DocHastings,SenOrrinHatch,USRepRHinojosa,WhipHoyer,RepMikeHonda,RepHensarling,RepBrianHiggins,SenDeanHeller,MazieHirono,GreggHarper,MartinHeinrich,JAHimes,Rep_Hunter,SenatorHagan,RepHanabusa,RepRichardHanna,RepAndyHarrisMD,RepHartzler,RepJoeHeck,HerreraBeutler,CongHuelskamp,RepHuizenga,RepHultgren,RepRobertHurt,SenJohnHoeven,Rep_JaniceHahn,RepDennyHeck,RepHolding,RepHorsford,RepRichHudson,RepHuffman,SenatorHeitkamp,InhofePress,SenatorIsakson,DarrellIssa,RepSteveIsrael,JacksonLeeTX18,RepEBJ,SamsPressShop,SenJohnsonSD,RepWalterJones,RepHankJohnson,Jim_Jordan,RepLynnJenkins,Mike_Johanns,RepBillJohnson,SenRonJohnson,RepJeffries,RepDaveJoyce,USRepDavidJolly,RepMarcyKaptur,RepRonKind,RepPeteKing,JackKingston,SenatorKirk,SteveKingIA,RepJohnKline,RepKirkpatrick,USRepKeating,MikeKellyPA,RepKinzinger,RepJoeKennedy,RepDanKildee,RepDerekKilmer,RepAnnieKuster,SenAngusKing,SenKaineOffice,RepRobinKelly,TomLatham,SenatorLeahy,SenCarlLevin,RepSandyLevin,RepJohnLewis,RepZoeLofgren,NitaLowey,RepFrankLucas,SenLandrieu,RepBarbaraLee,RepLoBiondo,RepJohnLarson,JimLangevin,RepRickLarsen,RepStephenLynch,RepLipinski,RepDLamborn,DaveLoebsack,BobLatta,RepLanceNJ7,RepBlainePress,RepBenRayLujan,CynthiaLummis,Raul_Labrador,RepLankford,USRepLong,SenMikeLee,RepLaMalfa,RepLowenthal,RepLujanGrisham,RepMaloney,MarkeyMemo,SenJohnMcCain,RepMcCarthyNY,RepMcGovern,McConnellPress,RepJimMcDermott,RepMikeMcIntyre,BuckMcKeon,SenatorMenendez,SenatorBarb,AskGeorge,Jim_Moran,JerryMoran,PattyMurray,GregoryMeeks,RepGaryMiller,RepJimMatheson,BettyMcCollum04,RepMikeMichaud,CandiceMiller,RepTimMurphy,LisaMurkowski,PatrickMcHenry,McCaulPressShop,RepKenMarchant,CathyMcMorris,RepGwenMoore,DorisMatsui,GOPWhip,RepMcNerney,ChrisMurphyCT,McCaskillOffice,RepDanMaffei,SenJeffMerkley,RepMcClintock,RepTomMarino,RepMcKinley,RepMeehan,RepMickMulvaney,Sen_JoeManchin,RepThomasMassie,RepSeanMaloney,RepMarkMeadows,RepGraceMeng,RepLukeMesser,RepMullin,RepMurphyFL,RepMcAllister,RepJerryNadler,RepRichardNeal,SenBillNelson,USRepRickNolan,EleanorNorton,GraceNapolitano,Rep_DevinNunes,RandyNeugebauer,RepKristiNoem,RepRichNugent,RepAlanNunnelee,RepMcLeod,OlsonPressShop,BillOwensNY,RepBetoORourke,FrankPallone,BillPascrell,NancyPelosi,RepJoePitts,SenRobPortman,RepDavidEPrice,RepStevePearce,SenMarkPryor,RepTomPrice,JudgeTedPoe,RepPerlmutter,RepErikPaulsen,RepGaryPeters,PedroPierluisi,ChelliePingree,JaredPolis,CongBillPosey,CongPalazzo,RepMikePompeo,SenRandPaul,RepDonaldPayne,RepScottPerry,RepPittenger,RepMarkPocan,RepScottPeters,RepMikeQuigley,CBRangel,SenJackReed,SenatorReid,SenPatRoberts,SenRockefeller,RepHalRogers,RosLehtinen,RepRoybalAllard,RepEdRoyce,RepBobbyRush,RepPaulRyan,RepMikeRogers,RepMikeRogersAL,Call_Me_Dutch,RepTimRyan,DaveReichert,PeterRoskam,DrPhilRoe,TomRooney,SenatorRisch,RepTomReed,RepJimRenacci,RepRibble,RepRichmond,RepScottRigell,RepMarthaRoby,ToddRokita,RepDennisRoss,RepJonRunyan,SenRubioPress,RepTomRice,KeithRothfus,CongressmanRuiz,RepMattSalmon,LorettaSanchez,SenSanders,RepSanfordSC,SenSchumer,RepBobbyScott,JimPressOffice,RepJoseSerrano,PeteSessions,SenShelby,BradSherman,RepShimkus,LouiseSlaughter,RepAdamSmith,RepChrisSmith,LamarSmithTX21,StabenowPress,SteveWorks4You,SenatorSessions,JanSchakowsky,CongMikeSimpson,RepAdamSchiff,RepBillShuster,RepLindaSanchez,RepDavidScott,Rep_Albio_Sires,RepJohnSarbanes,RepSheaPorter,RepAdrianSmith,RepSpeier,SteveScalise,RepAaronSchock,RepSchrader,SenatorShaheen,RepDavid,SenatorTimScott,RepTerriSewell,Rep_Southerland,RepSteveStivers,RepStutzman,AustinScottGA08,RepSchneider,RepSinema,RepChrisStewart,RepSwalwell,SenBrianSchatz,RepJasonSmith,BennieGThompson,MacTXPress,SenJohnThune,RepTierney,LEETERRYNE,RepThompson,SenToomey,TiberiPress,RepMikeTurner,TesterPress,NikiInTheHouse,CongressmanGT,RepDinaTitus,RepPaulTonko,RepTipton,RepMarkTakano,RepFredUpton,MarkUdall,SenatorTomUdall,NydiaVelazquez,RepVisclosky,ChrisVanHollen,RepDavidValadao,RepJuanVargas,RepVeasey,RepFilemonVela,MaxineWaters,WaxmanClimate,RepEdWhitfield,SenatorWicker,RepWOLFPress,RonWyden,RepGregWalden,RepJoeWilson,RepWestmoreland,RepDWStweets,RepWalberg,RepTimWalz,PeterWelch,SenWhitehouse,RobWittman,MarkWarner,RepWebster,RepWilson,Rep_SteveWomack,RepAnnWagner,RepWalorski,TXRandy14,RepBradWenstrup,RepRWilliams,SenWarren,SenWalshOffice,RepDonYoung,RepJohnYarmuth,RepKevinYoder,RepToddYoung,RepTedYoho".split(',');
    app.get('/battleforthenet_legislators.html', function(req, response) {
	    db.collection('tweets').find({"user.screen_name": {$nin : repHandles}}, {sort : [["user.followers_count", 'desc']], limit : 400}, function(err, res) {
			if (err) {
				callback(err);
				return;
			}
			res.toArray(function(err, docs) {
				if (err) {
					callback(err);
					return;
				}
				var tweets = docs;
		        var tweets = docs.map(function(tweet){
		        	return {
						tweet: tweet.text,
						handle: tweet.user.screen_name,
						name: tweet.user.name,
						avatar: tweet.user.profile_image_url,
						link: 'https://twitter.com/#!/' + tweet.user.screen_name + '/status/' + (tweet.id_str || 'broken') + '/',
						retweet_link: 'https://twitter.com/intent/retweet?tweet_id=' + (tweet.id_str|| 'broken'),
						followers: tweet.user.followers_count
		        	}
		        });
		        var html = "<table><tbody>";
		        tweets = _.uniq(tweets, 'handle');
		        _.each(tweets, function(tweet){
		        	html += '<tr><td><img src="'+tweet.avatar + '" /></td><td>' + tweet.handle + '</td><td>' + tweet.name + '</td><td>' + tweet.followers + '</td><td>'+ tweet.tweet + '</td></tr>';
		        });


		        html += "</tbody></table>";
		        response.send(html);

			});
		});
	// emails are sent via POST
    app.post('/email', function(req, res) {
    	email.call(app, req, res);
	});

	// expose some JSON endpoints as APIs
    app.get('/stats', function(req, res) {
    	req.io.route('stats');
	});
    app.get('/tweets', function(req, res) {
    	req.io.route('tweets');
	});

    app.post('/websites', function(req, res) {
    	req.io.route('websites');
	});

	//--------------------------------------------------------------------------
	// socket events

	// read global stats
	app.io.route('stats', function(req) {
		console.log('read stats');
    	stats.call(app, req);
	});

	// read tweets
	app.io.route('tweets', function(req) {
		console.log('read tweets');
    	tweets.call(app, req);
	});

    // log events
    app.io.route('log', function(req) {
    	log.call(app, req);
	});


    // website events
    app.io.route('websites', function(req) {
    	websites.call(app, req);
	});

	//--------------------------------------------------------------------------
	// broadcast daemons

	logBroadcaster(app);

	//--------------------------------------------------------------------------
	// init server

    var port = config.server_port || 5000;
    app.listen(port, function() {
        console.log('Listening on ' + port);
    });
}, function(err) {
	throw err;
});


