"use strict";
// =====================================================
//  GESCHICHTENBUCH 📖 „Die Reise zum Herzstern“
//  Ein Vorwort (gleich zu lesen) und 36 Kapitel. Kapitel n wird frei, sobald am
//  Fortschritts-Ring das n-te Symbol erscheint (anzeige.js, RING_PLAETZE = 36) –
//  das letzte Kapitel kommt also genau bei ∞.
//  {tier} = Name des ersten Haustiers (sonst "Mimi").
//
//  Gespeichert: spiel.buch = { gelesen: höchste gelesene Seite, bekannt: Anzahl freier Kapitel }
//  Diese Datei fasst das HTML nicht an (Bildschirm: geschichte-ui.js).
// =====================================================

const GESCHICHTE = {
  titel: "Die Reise zum Herzstern",
  kapitelAnzahl: 36,
};

// Seite 0 = Vorwort, Seite 1–36 = Kapitel
const GESCHICHTE_SEITEN = [
  { titel: "Es war einmal …", bild: "🌙🏡✨",
    text: "Es war einmal ein warmer Abend. Marie und Hannah schauten aus dem Fenster in den Sternenhimmel. Da sauste eine kleine Sternschnuppe herunter – direkt in den Garten! Sie hieß Funkel und weinte leise. „Der Herzstern hat sein Licht verloren“, schniefte Funkel. „Nur viele, viele Herzen können ihn wieder hell machen.“ Marie und Hannah sahen sich an. „Wir helfen dir!“, riefen beide gleichzeitig." },

  { titel: "Die Herz-Laterne", bild: "👭🏮💖",
    text: "Funkel war noch zu schwach zum Fliegen. Also bastelten Marie, Hannah und ihre beste Freundin eine Laterne aus Papier und klebten ein großes Herz darauf. Jedes Herz, das die Schwestern sammelten, ließ die Laterne heller leuchten. Und Funkel kuschelte sich hinein und lächelte zum ersten Mal." },
  { titel: "Brummi wacht auf", bild: "🧸✨😮",
    text: "In der Nacht hörten die Schwestern ein Gähnen. Der Teddy Brummi saß auf dem Bett und rieb sich die Knopfaugen! „Der Sternenstaub von Funkel hat mich aufgeweckt“, brummte er. „Darf ich mit auf die Reise?“ Natürlich durfte er. Brummi ist nämlich sehr mutig – jedenfalls, wenn das Licht an ist." },
  { titel: "{tier} hat eine feine Nase", bild: "🐾👃✨",
    text: "Am Morgen schnupperte {tier} aufgeregt am Gartenzaun. Da glitzerte etwas im Gras: eine Spur aus Sternenstaub! „Die führt bestimmt zum Herzstern“, rief Hannah. {tier} lief voraus, und alle folgten der glitzernden Spur." },
  { titel: "Der Blumengarten", bild: "🌷🌼🌸💧",
    text: "Die Spur führte in einen Garten, in dem die Blumen sprechen konnten. „Wir haben Durst“, flüsterte eine Tulpe. Marie und Hannah gossen jede Blume. Zum Dank schenkten die Blumen ihnen Tautropfen, die wie kleine Lampen leuchteten." },
  { titel: "Perlchen, das Einhorn", bild: "🦄🌊💫",
    text: "Hinter dem Garten rauschte ein breiter Bach. Wie sollten sie da hinüberkommen? Da trabte ein Einhorn heran. Es hieß Perlchen und hatte eine Mähne in allen Farben. „Steigt auf!“, sagte Perlchen und trug alle sicher ans andere Ufer." },
  { titel: "Im Feenschloss", bild: "🏰🧚✨",
    text: "Auf einem Hügel stand ein Schloss aus Glas. Darin wohnte die Feenkönigin. Sie streute ein bisschen Flügelstaub über die Schwestern – und plötzlich konnten sie ein kleines Stück über dem Boden schweben! „Das wird euch noch helfen“, sagte die Königin geheimnisvoll." },
  { titel: "Die Regenbogen-Rutsche", bild: "🌈😆🛝",
    text: "Vom Schlossturm aus führte ein Regenbogen bis hinauf in die Wolken. Marie und Hannah nahmen sich an den Händen und rutschten – allerdings nach oben! Bei jeder Farbe kribbelte es anders im Bauch. Bei Rosa mussten beide ganz laut lachen." },
  { titel: "Das Wolken-Karussell", bild: "🎠☁️🎶",
    text: "Oben in den Wolken drehte sich ein Karussell aus Zuckerwatte. Brummi durfte auf dem Pferdchen sitzen, {tier} auf dem Schwan. Das Karussell drehte sich immer schneller und immer höher – bis sie mitten im Nachthimmel ankamen." },
  { titel: "Der müde Mond", bild: "🌙😴🎵",
    text: "Im Mondpalast saß der Mond und gähnte. „Ich bin so müde, aber ich kann nicht schlafen“, seufzte er. Hannah sang ihm ihr liebstes Schlaflied. Der Mond lächelte und schenkte ihnen einen Kompass aus Mondlicht. Seine Nadel zeigte immer zum Herzstern." },
  { titel: "Der Glitzerplanet", bild: "🪐💎✨",
    text: "Der Kompass führte sie zu einem Planeten, auf dem alles glitzerte. Die Glitzerwesen dort spielten am liebsten Verstecken. Das war schwer, denn sie sahen aus wie Glitzer! Marie fand trotzdem alle – sie musste nur auf das Kichern hören." },
  { titel: "Die Herzgalaxie", bild: "🌌💖💖💖",
    text: "Hinter dem Glitzerplaneten lag eine Galaxie, in der alle Sterne Herzen waren. Funkel tanzte zwischen ihnen herum und wurde dabei immer heller. „Ich spüre es“, rief Funkel. „Wir sind auf dem richtigen Weg!“" },
  { titel: "Im Herzkönigreich", bild: "👑💖🏰",
    text: "Die Königin der Herzen empfing die Reisenden in ihrem Thronsaal. „Der Herzstern liegt hinter dem Sternenmeer“, erzählte sie. „Der Weg ist weit. Aber wer zusammenhält, kommt überall hin.“ Marie und Hannah drückten sich ganz fest." },

  { titel: "Das Sternenmeer", bild: "🌊⭐🌙⛵",
    text: "Das Sternenmeer war nicht nass, sondern voller funkelnder Lichtwellen. Die Schwestern bauten ein Boot aus einer Mondsichel. Neben ihnen sprangen Sternenfische aus den Wellen und spritzten mit Glitzer." },
  { titel: "Wal Wolke", bild: "🐋☁️💤",
    text: "Plötzlich hob sich das Boot hoch in die Luft – sie saßen auf dem Rücken eines riesigen Sternenwals! Er hieß Wolke und sprach ganz langsam und tief. „Ich bringe euch ein Stück“, brummte Wolke. Brummi fand, dass Wolke noch tiefer brummen konnte als er." },
  { titel: "Die Insel der Träume", bild: "🏝️🫧💭",
    text: "Wolke setzte sie auf einer Insel ab, auf der Träume als Seifenblasen herumschwebten. In einer Blase sah Marie, wovon Hannah träumt: von einem Pony mit Glitzerhufen. Marie lächelte und behielt das Geheimnis für sich." },
  { titel: "Der Kometensturm", bild: "☄️☄️💪",
    text: "Auf einmal zischten Kometen über den Himmel! Es rumpelte und blitzte. Hannah bekam Angst. Marie nahm sie in den Arm und sagte: „Zusammen schaffen wir das.“ Alle hielten sich aneinander fest, bis der Sturm vorüber war." },
  { titel: "Die Wolkenstadt", bild: "🏙️☁️🥐",
    text: "Nach dem Sturm landeten sie in einer Stadt aus Wolken. Dort backten Wolkenbäcker Regenbogen-Brötchen. Die schmeckten nach Erdbeere, Vanille und ein bisschen nach Abenteuer. {tier} aß gleich drei davon." },
  { titel: "Im Zuckerwatte-Nebel", bild: "🌫️🍭❓",
    text: "Hinter der Wolkenstadt wurde es neblig – der Nebel war aus Zuckerwatte und klebte an den Haaren. Niemand konnte mehr etwas sehen. Doch {tier} schnupperte und schnupperte und führte alle sicher hinaus. „Was wären wir ohne dich!“, rief Hannah." },
  { titel: "Der Polarlicht-Tanz", bild: "🌌💃🕺",
    text: "Am Himmel tanzten grüne und lila Lichter. „Das ist das Polarlicht!“, staunte Marie. Die Lichter forderten die Schwestern zum Tanzen auf. Marie drehte sich wie eine Ballerina, Hannah hüpfte wie ein Flummi. Beides war genau richtig." },
  { titel: "Die Pinguin-Station", bild: "🐧❄️🧣",
    text: "Auf einem Asteroiden aus Eis wohnten Pinguine mit Raumanzügen. Es war bitterkalt! Die Pinguine strickten jedem eine warme Mütze – sogar Brummi bekam eine, mit Bommel. Zum Abschied gab es heiße Schokolade." },
  { titel: "Die Sternenbibliothek", bild: "📚⭐🔍",
    text: "In einer Bibliothek, so groß wie ein Berg, standen Bücher über jeden Stern. Marie fand das Buch über den Herzstern. Darin stand: „Nur wer das Rätsel löst, findet den Weg.“ Doch das Rätsel stand auf der nächsten Seite – und die war zugeklebt." },
  { titel: "Das Rätsel", bild: "🚪❓💖",
    text: "Vor einer großen Tür stand die Frage: „Was wird mehr, wenn man es teilt?“ Alle überlegten lange. Dann rief Hannah: „Freude! Und Liebe!“ Die Tür schwang auf, und dahinter glitzerte der Weg weiter durchs All." },
  { titel: "Das Uhrwerk der Zeit", bild: "⚙️⏰🐢",
    text: "Sie kamen an riesigen Zahnrädern vorbei, die sich ganz langsam drehten. „Hier muss man Geduld haben“, sagte eine alte Schildkröte. Sie warteten, bis sich eine Lücke öffnete. Manchmal ist Geduld die beste Zauberkraft." },
  { titel: "Der Glühwürmchen-Wald", bild: "🌲✨🪲",
    text: "Mitten im All wuchs ein Wald, in dem Tausende Glühwürmchen leuchteten. Sie zeigten den Schwestern, wie man im Dunkeln den Weg findet: Man muss nur selbst ein bisschen leuchten. Funkel strahlte vor Stolz." },
  { titel: "Der traurige Drache", bild: "🐉😢🤗",
    text: "Auf einem Felsen saß ein kleiner Drache und weinte. Er hieß Flämmchen und hatte keine Freunde, weil alle Angst vor seinem Feuer hatten. Marie und Hannah setzten sich zu ihm. „Wir haben keine Angst“, sagten sie. Flämmchen weinte jetzt vor Freude." },
  { titel: "Flämmchens Flug", bild: "🐉💨👭",
    text: "Zum Dank ließ Flämmchen alle auf seinen Rücken klettern. Er flog schneller als jede Sternschnuppe! Hannah jubelte, Marie hielt Brummi fest, und {tier} streckte die Nase in den Wind." },
  { titel: "Das Schlummerloch", bild: "🌀😪😂",
    text: "Plötzlich zog ein sanfter Strudel an ihnen. Alle wurden furchtbar müde. „Nicht einschlafen!“, rief Marie. Da erzählte Hannah ihren lustigsten Witz. Alle lachten so laut, dass sie hellwach wurden – und aus dem Strudel herausflogen." },
  { titel: "Die Spiegelwelt", bild: "🪞🙃🔄",
    text: "In der nächsten Welt war alles verkehrt herum. Die Bäume wuchsen nach unten, und man sagte „Tschüss“, wenn man kam. Marie und Hannah lachten Tränen. „Hallo!“, sagten sie zum Abschied. Das war hier ganz richtig." },
  { titel: "Der Garten der verlorenen Sachen", bild: "🧦🎀🔑",
    text: "Hier landete alles, was auf der Erde verloren geht: Socken, Haargummis, Puzzleteile. Marie fand ihre Lieblings-Haarspange wieder! Hannah fand ein Puzzleteil, das seit Monaten fehlte. Was man liebt, geht eben nie ganz verloren." },
  { titel: "Die Musik der Sterne", bild: "🎶⭐🎹",
    text: "Die Sterne begannen zu summen – eine Melodie, so schön, dass alle still wurden. Marie und Hannah summten mit. Und weil sie es zusammen taten, klang es noch schöner. Der Herzstern war jetzt ganz nah." },
  { titel: "Die Brücke aus Freundschaft", bild: "🌉🤝💖",
    text: "Vor ihnen lag eine tiefe Schlucht. Da kamen alle Freunde der Reise: Perlchen, Wolke, die Pinguine und Flämmchen. Sie hielten sich an den Händen, Flossen und Pfoten und wurden zu einer Brücke. So ist das mit Freunden: Sie tragen einen." },
  { titel: "Fast da", bild: "🌟🔭💫",
    text: "In der Ferne sahen sie ihn endlich: den Herzstern! Er war riesig, aber sein Licht war schwach und blass. „Wir haben so viele Herzen gesammelt“, sagte Hannah. „Hoffentlich reicht es!“ Funkel nickte und schwieg." },
  { titel: "Funkels Geheimnis", bild: "✨💖🌟",
    text: "Da erzählte Funkel ein Geheimnis: „Ich bin ein Stück vom Herzstern. Als er dunkel wurde, bin ich abgebrochen.“ Marie und Hannah hielten Funkel ganz vorsichtig in ihren Händen. „Dann bringen wir dich jetzt nach Hause“, sagte Marie leise." },
  { titel: "Alle Herzen", bild: "💖💖💖💖💖",
    text: "Marie und Hannah öffneten die Herz-Laterne. Alle Herzen, die sie auf der ganzen Reise gesammelt hatten, flogen heraus – Millionen, Milliarden, unzählbar viele! Wie ein glitzernder Fluss strömten sie zum Herzstern." },
  { titel: "Der Herzstern erwacht", bild: "🌟💓🌟",
    text: "Der Herzstern begann zu pochen wie ein Herz. Bumm – bumm – bumm. Mit jedem Schlag wurde er heller. Gleich war es so weit. Nur noch ein allerletztes bisschen …" },
  { titel: "∞ Unendlich hell", bild: "♾️🌟👭💖",
    text: "Mit dem letzten Herz strahlte der Herzstern auf – so hell wie noch nie, unendlich hell! Funkel flog zu ihm hinauf und war endlich wieder zu Hause. Der Stern schickte einen Lichtstrahl, auf dem Marie, Hannah, Brummi und {tier} sanft nach Hause rutschten – direkt in ihre Betten. Am Morgen rief Mama zum Frühstück. War alles nur ein Traum? Vielleicht. Aber wenn ihr nachts zum Himmel schaut, seht ihr ihn: den hellsten Stern von allen. Ende." },
];

// Wie viele Kapitel sind frei? (genauso viele wie Symbole am Ring)
function kapitelFrei() {
  return Math.min(GESCHICHTE.kapitelAnzahl, Math.floor(wegZurUnendlichkeit() * GESCHICHTE.kapitelAnzahl + 1e-9));
}

function buchStand() {
  if (!spiel.buch) spiel.buch = { gelesen: -1, bekannt: 0 };
  return spiel.buch;
}

// Ungelesene Seiten (Vorwort zählt mit)
function ungeleseneSeiten() {
  return Math.max(0, kapitelFrei() - buchStand().gelesen);
}

function merkeGelesen(seite) {
  const b = buchStand();
  if (seite > b.gelesen) b.gelesen = seite;
}

// Text mit dem Namen des eigenen Haustiers
function seitenText(text) {
  const t = haustier(1);
  return text.replaceAll("{tier}", t ? t.name : "Mimi");
}
