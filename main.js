// V-Align (beta): put doubles and backing vocals in time with the lead.
// Pick the lead; every other selected audio track is a double. The page reads each track's
// waveform overview on a 5 ms grid, matches the double's envelope to the lead's (AlignCore),
// shows the double before and after over the lead, and on Align: saves the double unedited in a
// new version, cuts it into pieces, moves and stretches each piece onto the lead with LUNA's own
// time-stretch (Clip.trim with stretch), crossfades the joins and, if asked, consolidates.
// "Back to original" makes the unedited version active again.

(() => {
  const $ = (id) => document.getElementById(id);
  const VERSION = '0.9.3';
  const KEY = 'com.fedetrillo.align.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };
  const I18N = {"es": {"_name": "Español", "beta": "BETA", "betaTip": "Versión beta: si algo no va bien, haz Alt-clic en el número de versión para copiar un informe y mándalo a fedetrillo@gmail.com o al hilo de Discord.", "leadTip": "Voz principal: las demás se alinean con ella", "none": "Selecciona en LUNA la voz principal y las dobladas o coros", "strength": "Fuerza", "prec": "Precisión", "pTight": "Clavada", "pNormal": "Normal", "pLoose": "Natural", "pTightT": "A 5 ms: más trozos", "pNormalT": "A 10 ms", "pLooseT": "A 20 ms: menos trozos, más natural", "lgLead": "Principal", "lgB": "Antes", "lgA": "Después", "stats": "{b} ms → <b>{a} ms</b> · {p} trozos", "cons": "Consolidar", "consTip": "Al terminar, deja la doblada en un solo clip", "apply1": "Alinear", "applyN": "Alinear {n} pistas", "restore": "Volver al original", "restoreTip": "Activa la versión sin editar que se guardó antes de alinear ({v})", "reading": "Leyendo la forma de onda…", "matching": "Comparando…", "backingUp": "Guardando una copia sin editar de {name}…", "backupFailed": "No se pudo hacer la copia, no se ha tocado nada: {e}", "working": "{name}: {i} de {n} trozos…", "joining": "Fundiendo las uniones: {i} de {n}…", "consolidating": "Consolidando {name}…", "done": "Alineado · {p} trozos · original sin editar en {v}", "doneSome": "Alineado, pero {f} trozos no se pudieron mover (mira el informe)", "failed": "Error: {e}", "restored": "Original activo ({v}). La versión alineada sigue en la lista de versiones de LUNA.", "noOverview": "LUNA aún no ha analizado este audio: espera un momento", "waiting": "Esperando a LUNA…", "noSession": "Abre una sesión en LUNA", "report": "Informe copiado: pégalo en un correo a fedetrillo@gmail.com o en Discord", "color": "Color", "cYellow": "Amarillo", "cOrange": "Naranja", "cRed": "Rojo", "cGreen": "Verde", "cBlue": "Azul", "cPink": "Rosa", "cPurple": "Morado", "dark": "Oscuro", "grey": "Gris", "help": "Guía rápida", "helpBtn": "Guía", "tNext": "Siguiente", "tBack": "Atrás", "tSkip": "Saltar", "tDone": "Entendido", "langT": "Elige tu idioma", "langX": "La guía y toda la ventana lo usarán. Puedes cambiarlo luego aquí, arriba a la derecha.", "g1t": "Principal y dobladas", "g1": "Selecciona en LUNA la voz principal y una o varias dobladas o coros. Aquí eliges cuál es la principal: las demás se alinean con ella.", "g2t": "Antes y después", "g2": "La principal en gris, la doblada ahora en rojo y cómo quedará en color. Cambia el zoom y desplázate con la barra de abajo.", "g3t": "Fuerza y precisión", "g3": "Fuerza decide cuánto se acerca (al 80 % conserva algo de vida). Precisión: Clavada corta más trozos, Natural menos.", "g4t": "Alinear", "g4": "Antes de tocar nada guarda la doblada sin editar en una versión nueva (V2). Luego corta, mueve y estira cada trozo, funde las uniones y, si quieres, lo consolida.", "g5t": "Volver al original", "g5": "Activa la versión sin editar en un clic. La alineada sigue en la lista de versiones de LUNA para comparar.", "g6t": "Es una beta", "g6": "Si algo no va bien, Alt-clic en el número de versión copia un informe. Mándalo a fedetrillo@gmail.com o al hilo de Discord: nos ayuda a mejorarlo.", "zt": "Siempre a mano", "z": "Vuelve a esta guía cuando la necesites con el botón Guía."}, "en": {"_name": "English", "beta": "BETA", "betaTip": "Beta version: if something goes wrong, Alt-click the version number to copy a report and send it to fedetrillo@gmail.com or the Discord thread.", "leadTip": "Lead vocal: the others are aligned to it", "none": "Select the lead vocal and the doubles or backing vocals in LUNA", "strength": "Strength", "prec": "Precision", "pTight": "Tight", "pNormal": "Normal", "pLoose": "Natural", "pTightT": "Within 5 ms: more pieces", "pNormalT": "Within 10 ms", "pLooseT": "Within 20 ms: fewer pieces, more natural", "lgLead": "Lead", "lgB": "Before", "lgA": "After", "stats": "{b} ms → <b>{a} ms</b> · {p} pieces", "cons": "Consolidate", "consTip": "When done, leave the double as a single clip", "apply1": "Align", "applyN": "Align {n} tracks", "restore": "Back to original", "restoreTip": "Makes the unedited version saved before aligning active ({v})", "reading": "Reading the waveform…", "matching": "Matching…", "backingUp": "Saving an unedited copy of {name}…", "backupFailed": "Could not make the copy, nothing was changed: {e}", "working": "{name}: {i} of {n} pieces…", "joining": "Crossfading the joins: {i} of {n}…", "consolidating": "Consolidating {name}…", "done": "Aligned · {p} pieces · unedited original in {v}", "doneSome": "Aligned, but {f} pieces could not be moved (see the report)", "failed": "Error: {e}", "restored": "Original active ({v}). The aligned version is still in LUNA's version list.", "noOverview": "LUNA has not analysed this audio yet: wait a moment", "waiting": "Waiting for LUNA…", "noSession": "Open a session in LUNA", "report": "Report copied: paste it in an email to fedetrillo@gmail.com or on Discord", "color": "Colour", "cYellow": "Yellow", "cOrange": "Orange", "cRed": "Red", "cGreen": "Green", "cBlue": "Blue", "cPink": "Pink", "cPurple": "Purple", "dark": "Dark", "grey": "Grey", "help": "Quick guide", "helpBtn": "Guide", "tNext": "Next", "tBack": "Back", "tSkip": "Skip", "tDone": "Got it", "langT": "Choose your language", "langX": "The guide and the whole window will use it. You can change it later here, at the top right.", "g1t": "Lead and doubles", "g1": "Select the lead vocal and one or more doubles or backing vocals in LUNA. Pick the lead here: the others are aligned to it.", "g2t": "Before and after", "g2": "The lead in grey, the double as it is now in red, and how it will be in colour. Change the zoom and scroll with the bar below.", "g3t": "Strength and precision", "g3": "Strength sets how close it gets (80 % keeps some life). Precision: Tight cuts more pieces, Natural fewer.", "g4t": "Align", "g4": "Before touching anything it saves the double unedited in a new version (V2). Then it cuts, moves and stretches every piece, crossfades the joins and, if you like, consolidates.", "g5t": "Back to original", "g5": "Makes the unedited version active in one click. The aligned one stays in LUNA's version list to compare.", "g6t": "It is a beta", "g6": "If something goes wrong, Alt-click the version number to copy a report. Send it to fedetrillo@gmail.com or the Discord thread: it helps us improve it.", "zt": "Always at hand", "z": "Open this guide again whenever you need it with the Guide button."}, "ca": {"_name": "Català", "beta": "BETA", "betaTip": "Versió beta: si alguna cosa no va bé, fes Alt-clic al número de versió per copiar un informe i envia’l a fedetrillo@gmail.com o al fil de Discord.", "leadTip": "Veu principal: les altres s’hi alineen", "none": "Selecciona a LUNA la veu principal i les doblades o cors", "strength": "Força", "prec": "Precisió", "pTight": "Clavada", "pNormal": "Normal", "pLoose": "Natural", "pTightT": "A 5 ms: més trossos", "pNormalT": "A 10 ms", "pLooseT": "A 20 ms: menys trossos, més natural", "lgLead": "Principal", "lgB": "Abans", "lgA": "Després", "stats": "{b} ms → <b>{a} ms</b> · {p} trossos", "cons": "Consolidar", "consTip": "En acabar, deixa la doblada en un sol clip", "apply1": "Alinear", "applyN": "Alinear {n} pistes", "restore": "Tornar a l’original", "restoreTip": "Activa la versió sense editar desada abans d’alinear ({v})", "reading": "Llegint la forma d’ona…", "matching": "Comparant…", "backingUp": "Desant una còpia sense editar de {name}…", "backupFailed": "No s’ha pogut fer la còpia, no s’ha tocat res: {e}", "working": "{name}: {i} de {n} trossos…", "joining": "Fonent les unions: {i} de {n}…", "consolidating": "Consolidant {name}…", "done": "Alineat · {p} trossos · original sense editar a {v}", "doneSome": "Alineat, però {f} trossos no s’han pogut moure (mira l’informe)", "failed": "Error: {e}", "restored": "Original actiu ({v}). La versió alineada continua a la llista de versions de LUNA.", "noOverview": "LUNA encara no ha analitzat aquest àudio: espera un moment", "waiting": "Esperant LUNA…", "noSession": "Obre una sessió a LUNA", "report": "Informe copiat: enganxa’l en un correu a fedetrillo@gmail.com o a Discord", "color": "Color", "cYellow": "Groc", "cOrange": "Taronja", "cRed": "Vermell", "cGreen": "Verd", "cBlue": "Blau", "cPink": "Rosa", "cPurple": "Morat", "dark": "Fosc", "grey": "Gris", "help": "Guia ràpida", "helpBtn": "Guia", "tNext": "Següent", "tBack": "Enrere", "tSkip": "Saltar", "tDone": "Entesos", "langT": "Tria el teu idioma", "langX": "La guia i tota la finestra el faran servir. El pots canviar després aquí, a dalt a la dreta.", "g1t": "Principal i doblades", "g1": "Selecciona a LUNA la veu principal i una o més doblades o cors. Aquí tries quina és la principal: les altres s’hi alineen.", "g2t": "Abans i després", "g2": "La principal en gris, la doblada ara en vermell i com quedarà en color. Canvia el zoom i desplaça’t amb la barra de sota.", "g3t": "Força i precisió", "g3": "Força decideix quant s’hi acosta (al 80 % conserva una mica de vida). Precisió: Clavada talla més trossos, Natural menys.", "g4t": "Alinear", "g4": "Abans de tocar res desa la doblada sense editar en una versió nova (V2). Després talla, mou i estira cada tros, fon les unions i, si vols, la consolida.", "g5t": "Tornar a l’original", "g5": "Activa la versió sense editar amb un clic. L’alineada continua a la llista de versions de LUNA per comparar.", "g6t": "És una beta", "g6": "Si alguna cosa no va bé, Alt-clic al número de versió copia un informe. Envia’l a fedetrillo@gmail.com o al fil de Discord: ens ajuda a millorar-lo.", "zt": "Sempre a mà", "z": "Torna a aquesta guia quan la necessitis amb el botó Guia."}, "fr": {"_name": "Français", "beta": "BÊTA", "betaTip": "Version bêta : en cas de problème, faites Alt-clic sur le numéro de version pour copier un rapport et envoyez-le à fedetrillo@gmail.com ou sur le fil Discord.", "leadTip": "Voix principale : les autres s’alignent sur elle", "none": "Sélectionnez dans LUNA la voix principale et les doublures ou chœurs", "strength": "Force", "prec": "Précision", "pTight": "Serrée", "pNormal": "Normale", "pLoose": "Naturelle", "pTightT": "À 5 ms : plus de morceaux", "pNormalT": "À 10 ms", "pLooseT": "À 20 ms : moins de morceaux, plus naturel", "lgLead": "Principale", "lgB": "Avant", "lgA": "Après", "stats": "{b} ms → <b>{a} ms</b> · {p} morceaux", "cons": "Consolider", "consTip": "À la fin, laisse la doublure en un seul clip", "apply1": "Aligner", "applyN": "Aligner {n} pistes", "restore": "Revenir à l’original", "restoreTip": "Active la version non modifiée enregistrée avant l’alignement ({v})", "reading": "Lecture de la forme d’onde…", "matching": "Comparaison…", "backingUp": "Copie non modifiée de {name}…", "backupFailed": "Impossible de faire la copie, rien n’a été modifié : {e}", "working": "{name} : {i} sur {n} morceaux…", "joining": "Fondus aux jonctions : {i} sur {n}…", "consolidating": "Consolidation de {name}…", "done": "Aligné · {p} morceaux · original non modifié en {v}", "doneSome": "Aligné, mais {f} morceaux n’ont pas pu être déplacés (voir le rapport)", "failed": "Erreur : {e}", "restored": "Original actif ({v}). La version alignée reste dans la liste des versions de LUNA.", "noOverview": "LUNA n’a pas encore analysé cet audio : attendez un instant", "waiting": "En attente de LUNA…", "noSession": "Ouvrez une session dans LUNA", "report": "Rapport copié : collez-le dans un e-mail à fedetrillo@gmail.com ou sur Discord", "color": "Couleur", "cYellow": "Jaune", "cOrange": "Orange", "cRed": "Rouge", "cGreen": "Vert", "cBlue": "Bleu", "cPink": "Rose", "cPurple": "Violet", "dark": "Sombre", "grey": "Gris", "help": "Guide rapide", "helpBtn": "Guide", "tNext": "Suivant", "tBack": "Retour", "tSkip": "Passer", "tDone": "Compris", "langT": "Choisissez votre langue", "langX": "Le guide et toute la fenêtre l’utiliseront. Vous pourrez la changer ici, en haut à droite.", "g1t": "Principale et doublures", "g1": "Sélectionnez dans LUNA la voix principale et une ou plusieurs doublures ou chœurs. Choisissez ici la principale : les autres s’alignent sur elle.", "g2t": "Avant et après", "g2": "La principale en gris, la doublure actuelle en rouge et le résultat en couleur. Changez le zoom et faites défiler avec la barre du bas.", "g3t": "Force et précision", "g3": "La force règle à quel point elle s’approche (80 % garde un peu de vie). Précision : Serrée coupe plus de morceaux, Naturelle moins.", "g4t": "Aligner", "g4": "Avant de toucher à quoi que ce soit, la doublure est copiée intacte dans une nouvelle version (V2). Puis chaque morceau est coupé, déplacé et étiré, les jonctions reçoivent un fondu et, si vous voulez, tout est consolidé.", "g5t": "Revenir à l’original", "g5": "Active la version non modifiée en un clic. L’alignée reste dans la liste des versions de LUNA pour comparer.", "g6t": "C’est une bêta", "g6": "En cas de problème, Alt-clic sur le numéro de version copie un rapport. Envoyez-le à fedetrillo@gmail.com ou sur le fil Discord : cela nous aide à l’améliorer.", "zt": "Toujours à portée", "z": "Rouvrez ce guide quand vous voulez avec le bouton Guide."}, "de": {"_name": "Deutsch", "beta": "BETA", "betaTip": "Beta-Version: Wenn etwas nicht klappt, Alt-Klick auf die Versionsnummer kopiert einen Bericht. Schick ihn an fedetrillo@gmail.com oder in den Discord-Thread.", "leadTip": "Hauptstimme: die anderen werden an ihr ausgerichtet", "none": "Wähle in LUNA die Hauptstimme und die Doppelungen oder Chöre", "strength": "Stärke", "prec": "Genauigkeit", "pTight": "Exakt", "pNormal": "Normal", "pLoose": "Natürlich", "pTightT": "Auf 5 ms: mehr Stücke", "pNormalT": "Auf 10 ms", "pLooseT": "Auf 20 ms: weniger Stücke, natürlicher", "lgLead": "Haupt", "lgB": "Vorher", "lgA": "Nachher", "stats": "{b} ms → <b>{a} ms</b> · {p} Stücke", "cons": "Konsolidieren", "consTip": "Am Ende bleibt die Doppelung ein einziger Clip", "apply1": "Ausrichten", "applyN": "{n} Spuren ausrichten", "restore": "Zum Original", "restoreTip": "Aktiviert die unbearbeitete Version, die vor dem Ausrichten gespeichert wurde ({v})", "reading": "Wellenform wird gelesen…", "matching": "Wird verglichen…", "backingUp": "Unbearbeitete Kopie von {name} wird gespeichert…", "backupFailed": "Kopie nicht möglich, nichts wurde geändert: {e}", "working": "{name}: {i} von {n} Stücken…", "joining": "Übergänge werden geblendet: {i} von {n}…", "consolidating": "{name} wird konsolidiert…", "done": "Ausgerichtet · {p} Stücke · unbearbeitetes Original in {v}", "doneSome": "Ausgerichtet, aber {f} Stücke ließen sich nicht verschieben (siehe Bericht)", "failed": "Fehler: {e}", "restored": "Original aktiv ({v}). Die ausgerichtete Version bleibt in LUNAs Versionsliste.", "noOverview": "LUNA hat dieses Audio noch nicht analysiert: kurz warten", "waiting": "Warte auf LUNA…", "noSession": "Öffne eine Session in LUNA", "report": "Bericht kopiert: füge ihn in eine E-Mail an fedetrillo@gmail.com oder auf Discord ein", "color": "Farbe", "cYellow": "Gelb", "cOrange": "Orange", "cRed": "Rot", "cGreen": "Grün", "cBlue": "Blau", "cPink": "Pink", "cPurple": "Lila", "dark": "Dunkel", "grey": "Grau", "help": "Kurzanleitung", "helpBtn": "Anleitung", "tNext": "Weiter", "tBack": "Zurück", "tSkip": "Überspringen", "tDone": "Verstanden", "langT": "Wähle deine Sprache", "langX": "Die Anleitung und das ganze Fenster verwenden sie. Du kannst sie später hier oben rechts ändern.", "g1t": "Haupt und Doppelungen", "g1": "Wähle in LUNA die Hauptstimme und eine oder mehrere Doppelungen oder Chöre. Hier legst du die Hauptstimme fest: die anderen werden an ihr ausgerichtet.", "g2t": "Vorher und nachher", "g2": "Die Hauptstimme in Grau, die Doppelung jetzt in Rot und das Ergebnis in Farbe. Zoom ändern und mit dem Balken unten scrollen.", "g3t": "Stärke und Genauigkeit", "g3": "Stärke bestimmt, wie nah sie herankommt (80 % lässt etwas Leben). Genauigkeit: Exakt schneidet mehr Stücke, Natürlich weniger.", "g4t": "Ausrichten", "g4": "Bevor etwas geändert wird, wird die Doppelung unbearbeitet in eine neue Version (V2) kopiert. Dann wird jedes Stück geschnitten, verschoben und gedehnt, die Übergänge geblendet und, wenn du willst, alles konsolidiert.", "g5t": "Zum Original", "g5": "Aktiviert die unbearbeitete Version mit einem Klick. Die ausgerichtete bleibt zum Vergleichen in LUNAs Versionsliste.", "g6t": "Es ist eine Beta", "g6": "Wenn etwas nicht klappt, Alt-Klick auf die Versionsnummer kopiert einen Bericht. Schick ihn an fedetrillo@gmail.com oder in den Discord-Thread: das hilft uns, es zu verbessern.", "zt": "Immer zur Hand", "z": "Öffne diese Anleitung jederzeit wieder mit dem Button Anleitung."}, "it": {"_name": "Italiano", "beta": "BETA", "betaTip": "Versione beta: se qualcosa non va, Alt-clic sul numero di versione copia un rapporto. Mandalo a fedetrillo@gmail.com o nel thread di Discord.", "leadTip": "Voce principale: le altre si allineano a lei", "none": "Seleziona in LUNA la voce principale e i doppi o i cori", "strength": "Forza", "prec": "Precisione", "pTight": "Stretta", "pNormal": "Normale", "pLoose": "Naturale", "pTightT": "Entro 5 ms: più pezzi", "pNormalT": "Entro 10 ms", "pLooseT": "Entro 20 ms: meno pezzi, più naturale", "lgLead": "Principale", "lgB": "Prima", "lgA": "Dopo", "stats": "{b} ms → <b>{a} ms</b> · {p} pezzi", "cons": "Consolida", "consTip": "Alla fine lascia il doppio in un’unica clip", "apply1": "Allinea", "applyN": "Allinea {n} tracce", "restore": "Torna all’originale", "restoreTip": "Attiva la versione non modificata salvata prima di allineare ({v})", "reading": "Lettura della forma d’onda…", "matching": "Confronto…", "backingUp": "Salvataggio di una copia non modificata di {name}…", "backupFailed": "Impossibile fare la copia, non è stato toccato nulla: {e}", "working": "{name}: {i} di {n} pezzi…", "joining": "Dissolvenze sulle giunture: {i} di {n}…", "consolidating": "Consolidamento di {name}…", "done": "Allineato · {p} pezzi · originale non modificato in {v}", "doneSome": "Allineato, ma {f} pezzi non si sono potuti spostare (vedi il rapporto)", "failed": "Errore: {e}", "restored": "Originale attivo ({v}). La versione allineata resta nell’elenco delle versioni di LUNA.", "noOverview": "LUNA non ha ancora analizzato questo audio: aspetta un momento", "waiting": "In attesa di LUNA…", "noSession": "Apri una sessione in LUNA", "report": "Rapporto copiato: incollalo in un’e-mail a fedetrillo@gmail.com o su Discord", "color": "Colore", "cYellow": "Giallo", "cOrange": "Arancione", "cRed": "Rosso", "cGreen": "Verde", "cBlue": "Blu", "cPink": "Rosa", "cPurple": "Viola", "dark": "Scuro", "grey": "Grigio", "help": "Guida rapida", "helpBtn": "Guida", "tNext": "Avanti", "tBack": "Indietro", "tSkip": "Salta", "tDone": "Capito", "langT": "Scegli la tua lingua", "langX": "La guida e tutta la finestra la useranno. Puoi cambiarla poi qui, in alto a destra.", "g1t": "Principale e doppi", "g1": "Seleziona in LUNA la voce principale e uno o più doppi o cori. Qui scegli la principale: le altre si allineano a lei.", "g2t": "Prima e dopo", "g2": "La principale in grigio, il doppio adesso in rosso e il risultato a colori. Cambia lo zoom e scorri con la barra in basso.", "g3t": "Forza e precisione", "g3": "La forza decide quanto si avvicina (all’80 % conserva un po’ di vita). Precisione: Stretta taglia più pezzi, Naturale meno.", "g4t": "Allinea", "g4": "Prima di toccare qualcosa salva il doppio non modificato in una nuova versione (V2). Poi taglia, sposta e stira ogni pezzo, sfuma le giunture e, se vuoi, consolida.", "g5t": "Torna all’originale", "g5": "Attiva la versione non modificata con un clic. Quella allineata resta nell’elenco delle versioni di LUNA per confrontare.", "g6t": "È una beta", "g6": "Se qualcosa non va, Alt-clic sul numero di versione copia un rapporto. Mandalo a fedetrillo@gmail.com o nel thread di Discord: ci aiuta a migliorarlo.", "zt": "Sempre a portata di mano", "z": "Riapri questa guida quando ti serve con il pulsante Guida."}, "pt": {"_name": "Português", "beta": "BETA", "betaTip": "Versão beta: se algo correr mal, Alt-clique no número da versão para copiar um relatório e envia-o para fedetrillo@gmail.com ou para o fio do Discord.", "leadTip": "Voz principal: as outras alinham-se com ela", "none": "Seleciona no LUNA a voz principal e as dobras ou coros", "strength": "Força", "prec": "Precisão", "pTight": "Cravada", "pNormal": "Normal", "pLoose": "Natural", "pTightT": "A 5 ms: mais pedaços", "pNormalT": "A 10 ms", "pLooseT": "A 20 ms: menos pedaços, mais natural", "lgLead": "Principal", "lgB": "Antes", "lgA": "Depois", "stats": "{b} ms → <b>{a} ms</b> · {p} pedaços", "cons": "Consolidar", "consTip": "No fim, deixa a dobra num só clip", "apply1": "Alinhar", "applyN": "Alinhar {n} faixas", "restore": "Voltar ao original", "restoreTip": "Ativa a versão sem edição guardada antes de alinhar ({v})", "reading": "A ler a forma de onda…", "matching": "A comparar…", "backingUp": "A guardar uma cópia sem edição de {name}…", "backupFailed": "Não foi possível fazer a cópia, nada foi alterado: {e}", "working": "{name}: {i} de {n} pedaços…", "joining": "Fades nas junções: {i} de {n}…", "consolidating": "A consolidar {name}…", "done": "Alinhado · {p} pedaços · original sem edição em {v}", "doneSome": "Alinhado, mas {f} pedaços não se puderam mover (vê o relatório)", "failed": "Erro: {e}", "restored": "Original ativo ({v}). A versão alinhada continua na lista de versões do LUNA.", "noOverview": "O LUNA ainda não analisou este áudio: espera um momento", "waiting": "À espera do LUNA…", "noSession": "Abre uma sessão no LUNA", "report": "Relatório copiado: cola-o num e-mail para fedetrillo@gmail.com ou no Discord", "color": "Cor", "cYellow": "Amarelo", "cOrange": "Laranja", "cRed": "Vermelho", "cGreen": "Verde", "cBlue": "Azul", "cPink": "Rosa", "cPurple": "Roxo", "dark": "Escuro", "grey": "Cinzento", "help": "Guia rápido", "helpBtn": "Guia", "tNext": "Seguinte", "tBack": "Voltar", "tSkip": "Saltar", "tDone": "Percebi", "langT": "Escolhe o teu idioma", "langX": "O guia e toda a janela vão usá-lo. Podes mudá-lo depois aqui, em cima à direita.", "g1t": "Principal e dobras", "g1": "Seleciona no LUNA a voz principal e uma ou mais dobras ou coros. Aqui escolhes a principal: as outras alinham-se com ela.", "g2t": "Antes e depois", "g2": "A principal a cinzento, a dobra agora a vermelho e como vai ficar a cores. Muda o zoom e desloca-te com a barra em baixo.", "g3t": "Força e precisão", "g3": "A força decide quanto se aproxima (a 80 % mantém alguma vida). Precisão: Cravada corta mais pedaços, Natural menos.", "g4t": "Alinhar", "g4": "Antes de mexer em nada guarda a dobra sem edição numa versão nova (V2). Depois corta, move e estica cada pedaço, faz fade nas junções e, se quiseres, consolida.", "g5t": "Voltar ao original", "g5": "Ativa a versão sem edição num clique. A alinhada continua na lista de versões do LUNA para comparar.", "g6t": "É uma beta", "g6": "Se algo correr mal, Alt-clique no número da versão copia um relatório. Envia-o para fedetrillo@gmail.com ou para o fio do Discord: ajuda-nos a melhorá-lo.", "zt": "Sempre à mão", "z": "Volta a este guia quando precisares com o botão Guia."}};
  for (const [c, v] of Object.entries({"es": {"eta": "quedan unos {t}", "took": "Ha tardado {t}", "close": "Vale"}, "en": {"eta": "about {t} left", "took": "Took {t}", "close": "OK"}, "ca": {"eta": "queden uns {t}", "took": "Ha trigat {t}", "close": "D’acord"}, "fr": {"eta": "encore environ {t}", "took": "Durée : {t}", "close": "OK"}, "de": {"eta": "noch etwa {t}", "took": "Dauer: {t}", "close": "OK"}, "it": {"eta": "mancano circa {t}", "took": "Ci ha messo {t}", "close": "OK"}, "pt": {"eta": "faltam cerca de {t}", "took": "Demorou {t}", "close": "OK"}})) Object.assign(I18N[c], v);
  let lang = store.get('lang') ?? (() => { for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; } return 'en'; })();
  if (!I18N[lang]) lang = 'en';
  const t = (k, v = {}) => String(I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));
  let statusTimer;
  const say = (key, vars = {}, kind = '', ms = 0) => { clearTimeout(statusTimer); $('status').textContent = key ? t(key, vars) : ''; $('status').className = `status grow ${kind}`; if (ms) statusTimer = setTimeout(() => say(null), ms); };
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 400) log.shift(); };
  const errText = (e) => String(e?.message || e);

  const opts = { strength: 100, maxShift: 200, zoom: 4, tol: 10, cons: true, ...(store.get('opts') ?? {}) };
  if (![5, 10, 20].includes(opts.tol)) opts.tol = 10;
  const save = () => store.set('opts', opts);
  let redraw = () => {}, recompute = () => {}, paintTop = () => {};
  let lastBackups = [];
  // ---- Progress and the end-of-run notice ---------------------------------------------------
  // Each double is one share of the bar; inside it: copy 2 %, cut 3 %, pieces 60 %, joins 25 %,
  // consolidate 10 %.
  const PHASE = { copy: [0, 0.02], cut: [0.02, 0.05], pieces: [0.05, 0.65], joins: [0.65, 0.9], cons: [0.9, 1] };
  const prog = { on: false, k: 0, n: 1, t0: 0 };
  const fmtTime = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)} min ${String(Math.round(sec % 60)).padStart(2, '0')} s` : `${Math.max(1, Math.round(sec))} s`);
  function progress(phase, frac = 0) {
    const [a, b] = PHASE[phase];
    const total = Math.min(1, (prog.k + a + (b - a) * Math.max(0, Math.min(1, frac))) / prog.n);
    const el = (performance.now() - prog.t0) / 1000;
    $('bar').hidden = false; $('bar').className = 'bar run';
    $('barFill').style.width = `${(total * 100).toFixed(1)}%`;
    $('barPct').textContent = `${Math.round(total * 100)} %`;
    const eta = total > 0.04 && el > 3 ? t('eta', { t: fmtTime((el / total) * (1 - total)) }) : '';
    $('barEta').textContent = [$('status').textContent, eta].filter(Boolean).join(' · ');
  }
  function chime(ok) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [660, 880] : [440, 330];
      notes.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), at = ac.currentTime + i * 0.16;
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.18, at + 0.02); g.gain.exponentialRampToValueAtTime(0.001, at + 0.35);
        o.start(at); o.stop(at + 0.4);
      });
      setTimeout(() => ac.close?.(), 1200);
    } catch { /* no sound: fine */ }
  }
  function finish(ok, text) {
    const secs = (performance.now() - prog.t0) / 1000;
    $('barFill').style.width = '100%'; $('barPct').textContent = ok ? '100 %' : ''; $('barEta').textContent = '';
    $('bar').className = `bar ${ok ? 'ok' : 'bad'}`;
    $('doneText').textContent = text; $('doneTime').textContent = t('took', { t: fmtTime(secs) });
    $('doneBox').className = `donebox ${ok ? 'ok' : 'bad'}`; $('doneBox').hidden = false;
    $('doneIcon').textContent = ok ? '✓' : '!';
    chime(ok);
  }
  $('doneOk').onclick = () => { $('doneBox').hidden = true; $('bar').hidden = true; };
  let tour = null;

  // ---- Look: theme, colour, language ---------------------------------------------------------
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';
  const COLORS = ['yellow', 'orange', 'red', 'green', 'blue', 'pink', 'purple'];
  let color = COLORS.includes(store.get('color')) ? store.get('color') : 'green';
  const closeColors = () => { $('colorMenu').hidden = true; $('colorBtn').classList.remove('open'); };
  $('colorBtn').onclick = (ev) => { ev.stopPropagation(); const open = $('colorMenu').hidden; $('colorMenu').hidden = !open; $('colorBtn').classList.toggle('open', open); };
  document.addEventListener('mousedown', (ev) => { if (!ev.target.closest?.('.colors')) closeColors(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeColors(); });
  const PREC = [[5, 'pTight'], [10, 'pNormal'], [20, 'pLoose']];
  function paintStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.color = color;
    $('ver').textContent = `v${VERSION}`; $('ver').title = t('betaTip');
    $('beta').textContent = t('beta'); $('beta').title = t('betaTip');
    $('lead').title = t('leadTip');
    $('help').title = t('help'); $('help').setAttribute('aria-label', t('help'));
    { const q = document.createElement('b'); q.textContent = '?'; const sp = document.createElement('span'); sp.textContent = t('helpBtn'); $('help').replaceChildren(q, sp); }
    $('colorBtn').title = t('color');
    $('colorMenu').replaceChildren(...COLORS.map((c) => {
      const b = document.createElement('button'); b.className = c === color ? 'on' : '';
      b.innerHTML = `<i class="sw" data-color="${c}" data-theme="${theme}"></i><span></span><svg viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5"/></svg>`;
      b.querySelector('span').textContent = t(`c${c[0].toUpperCase()}${c.slice(1)}`);
      b.onclick = () => { color = c; store.set('color', c); closeColors(); paintStatic(); };
      return b;
    }));
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); }
    $('lang').replaceChildren(...Object.keys(I18N).map((c) => Object.assign(document.createElement('option'), { value: c, textContent: I18N[c]._name })));
    $('lang').value = lang;
    $('legend').innerHTML = `<span><i style="background:var(--lead)"></i>${t('lgLead')}</span><span><i style="background:var(--before)"></i>${t('lgB')}</span><span><i style="background:var(--acc)"></i>${t('lgA')}</span>`;
    $('strLabel').textContent = t('strength'); $('precLabel').textContent = t('prec');
    $('strength').value = opts.strength; $('strOut').textContent = `${opts.strength} %`;
    $('prec').replaceChildren(...PREC.map(([v, k]) => { const b = document.createElement('button'); b.textContent = t(k); b.title = t(k + 'T'); b.className = opts.tol === v ? 'on' : ''; b.onclick = () => { opts.tol = v; save(); paintStatic(); recompute(true); }; return b; }));
    $('cons').checked = !!opts.cons; $('consLabel').textContent = t('cons'); $('consBox').title = t('consTip');
    $('undo').textContent = t('restore'); $('doneOk').textContent = t('close');
    $('zoom').value = String(opts.zoom);
    paintTop(); redraw();
  }
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  $('strength').oninput = () => { opts.strength = Number($('strength').value); $('strOut').textContent = `${opts.strength} %`; save(); recompute(true); };
  $('cons').onchange = () => { opts.cons = $('cons').checked; save(); };
  $('zoom').onchange = () => { opts.zoom = Number($('zoom').value); save(); redraw(); };
  $('pos').oninput = () => redraw();
  paintStatic();

  let luna, built;
  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    if (!s) { say('noSession'); return; }
    await s.ready(); if (s !== built) return;
    await s.musical.ready();
    say(null);
    const tl = s.musical.timeline, ctx = s.context;
    const A = window.AlignCore;
    const MSP = 5;
    const cache = new Luna.Waveforms({ maxPages: 2048 });
    let busy = false, undoSteps = 0, seq = 0;
    let state = null;       // { S, E, n, t0, lead:{tk,peaks}, dbls:[{tk, peaks, lane, res}] }
    let leadId = store.get('lead');

    function selection() {
      const ids = ctx.selectionTracks.value ?? [];
      const tracks = ids.map((id) => s.tracks.byId(id)).filter((x) => x && x.trackType?.value === 'audio');
      const S = ctx.selectionStart.value, E = ctx.selectionStop.value;
      const range = typeof S === 'number' && typeof E === 'number' && E > S ? { S, E } : null;
      return { tracks, range };
    }
    async function segsOf(tk) {
      const lane = s.playlistFor(tk);
      if (!lane) return { lane: null, segs: [] };
      await lane.clips.load();
      await lane.compiledClips?.load?.().catch(() => undefined);
      return { lane, segs: (lane.compiledClips?.inOrder?.() ?? []).filter((g) => g.stop?.value > g.start?.value) };
    }
    // Peaks of one track on a grid of n points from t0 seconds, MSP ms apart (null where no clip).
    async function readPeaks(tk, t0, n) {
      const { lane, segs } = await segsOf(tk);
      const peaks = new Array(n).fill(null);
      const ticks = new Float64Array(n);
      for (let i = 0; i < n; i++) ticks[i] = tl.tickAtSeconds(t0 + (i * MSP) / 1000);
      const first = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (ticks[m] < x) lo = m + 1; else hi = m; } return lo; };
      let missing = 0;
      await s.sources?.load?.().catch(() => undefined);
      for (const g of segs) {
        const a = Math.max(ticks[0], g.start.value), b = Math.min(ticks[n - 1] + 1, g.stop.value);
        if (b <= a) continue;
        const clip = lane.clips.byId(g.clipUid.value);
        const audio = clip && Luna.compiledClipAudio(tl, g, clip, s.sources);
        if (!audio) { missing++; continue; }
        let nsA = Math.max(audio.startNs, Luna.audioNsAtTick(tl, g, audio, a)), nsB = Math.min(audio.stopNs, Luna.audioNsAtTick(tl, g, audio, b));
        if (nsB <= nsA) continue;
        let rg; try { rg = await cache.range(audio.source, nsA, nsB, 'fine'); } catch (e) { note('overview', { e: errText(e) }); missing++; continue; }
        if (!rg?.count) { missing++; continue; }
        const lin = 10 ** ((Number(clip.gain?.value) || 0) / 20);
        const per = Math.max(1, Math.round((MSP * 1e6) / rg.pairNs));
        for (let i = first(a); i < n && ticks[i] < b; i++) {
          const p0 = Math.floor(Luna.audioNsAtTick(tl, g, audio, ticks[i]) / rg.pairNs) - rg.index;
          let pk = 0;
          for (let p = p0; p < p0 + per; p++) { if (p < 0 || p >= rg.count) continue; for (const ch of rg.channels) pk = Math.max(pk, Math.abs(ch.min[p]), Math.abs(ch.max[p])); }
          peaks[i] = pk * lin;
        }
      }
      return { lane, peaks, missing, segs: segs.length };
    }
    paintTop = () => {
      const { tracks } = selection();
      const sel = $('lead');
      sel.replaceChildren(...tracks.map((x) => Object.assign(document.createElement('option'), { value: x.id, textContent: x.name.value })));
      if (!tracks.some((x) => x.id === leadId)) leadId = tracks[0]?.id ?? null;
      sel.value = leadId ?? ''; sel.disabled = tracks.length < 2;
      const dbls = tracks.filter((x) => x.id !== leadId);
      $('chips').replaceChildren(...dbls.map((x) => { const c = document.createElement('span'); c.className = 'chip'; c.innerHTML = '<i></i><span></span>'; c.lastChild.textContent = x.name.value; return c; }));
      $('hint').textContent = tracks.length < 2 ? t('none') : '';
      $('apply').textContent = dbls.length > 1 ? t('applyN', { n: dbls.length }) : t('apply1');
      $('apply').disabled = busy || !dbls.length || !state?.dbls?.some((d) => d.res?.moved);
      $('undo').disabled = busy || !lastBackups.length;
      $('undo').title = lastBackups.length ? t('restoreTip', { v: lastBackups.map((b) => `${b.name} V${b.v}`).join(', ') }) : '';
      return { tracks, dbls };
    };
    $('lead').onchange = () => { leadId = $('lead').value; store.set('lead', leadId); void refresh(); };

    // ---- The view: a window of the span, scrolled with the slider ----------------------------
    redraw = () => {
      const rows = $('rows');
      if (!state) { rows.innerHTML = `<div class="empty">${t('none')}</div>`; $('where').textContent = ''; $('stats').innerHTML = ''; return; }
      const { n, lead } = state;
      const win = Math.max(2, Math.min(n, Math.round((opts.zoom * 1000) / MSP)));
      const start = Math.round((Number($('pos').value) / 1000) * Math.max(0, n - win)), end = Math.min(n, start + win);
      const W = 1000, H = 100, MID = H / 2;
      const y = (v) => (v == null ? 0 : Math.max(0, Math.min(1, (A.toDb(v) + 54) / 54)) * (MID - 4));
      const X = (k) => ((k - start) / (win - 1)) * W;
      const area = (pk) => { let top = '', bot = ''; for (let k = start; k < end; k++) { const x = X(k), h = y(pk[k]); top += `${k > start ? 'L' : 'M'}${x.toFixed(1)} ${(MID - h).toFixed(1)}`; bot = `L${x.toFixed(1)} ${(MID + h).toFixed(1)}` + bot; } return top + bot + 'Z'; };
      const line = (pk) => { let d = ''; for (let k = start; k < end; k++) d += `${k > start ? 'L' : 'M'}${X(k).toFixed(1)} ${(MID - y(pk[k])).toFixed(1)}`; return d; };
      const leadArea = area(lead.peaks);
      rows.replaceChildren(...state.dbls.map((d) => {
        const r = document.createElement('div'); r.className = 'row';
        const aft = d.res ? A.warped(d.peaks, d.res.pieces, n) : d.peaks;
        const cuts = (d.res?.pieces ?? []).filter((p) => p.ta > start && p.ta < end).map((p) => `<line class="cut" x1="${X(p.ta).toFixed(1)}" x2="${X(p.ta).toFixed(1)}" y1="0" y2="${H}"/>`).join('');
        r.innerHTML = `<span class="name"></span><span class="gap"></span><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="lead-f" d="${leadArea}"/>${cuts}<path class="ln-b" d="${line(d.peaks)}"/><path class="ln-a" d="${line(aft)}"/></svg>`;
        r.querySelector('.name').textContent = d.tk.name.value;
        if (d.res) r.querySelector('.gap').innerHTML = `<span style="color:var(--before)">${Math.round(d.res.before)}</span> → <span style="color:var(--acc)">${Math.round(d.res.after)} ms</span>`;
        return r;
      }));
      const tick = (k) => tl.tickAtSeconds(state.t0 + (k * MSP) / 1000);
      $('where').textContent = `${tl.formatBarBeat(tick(start))} → ${tl.formatBarBeat(tick(end))}`;
      const rs = state.dbls.filter((d) => d.res);
      $('stats').innerHTML = rs.length ? t('stats', { b: Math.round(rs.reduce((x, d) => x + d.res.before, 0) / rs.length), a: Math.round(rs.reduce((x, d) => x + d.res.after, 0) / rs.length), p: rs.reduce((x, d) => x + d.res.moved, 0) }) : '';
    };
    recompute = (fast) => {
      if (!state) return;
      for (const d of state.dbls) d.res = A.align(state.lead.peaks, d.peaks, MSP, { maxShift: opts.maxShift, strength: opts.strength / 100, minPiece: 60, tol: opts.tol });
      redraw(); paintTop();
    };

    async function refresh(quiet) {
      const my = ++seq;
      const { tracks, range } = selection();
      const { dbls } = paintTop();
      const lead = tracks.find((x) => x.id === leadId);
      if (!lead || !dbls.length) { state = null; redraw(); paintTop(); return; }
      if (!quiet) say('reading');
      // The span: the range, or every clip of the tracks involved.
      let S = range?.S, E = range?.E;
      if (!range) {
        for (const tk of [lead, ...dbls]) { const { segs } = await segsOf(tk); for (const g of segs) { S = Math.min(S ?? Infinity, g.start.value); E = Math.max(E ?? -Infinity, g.stop.value); } }
      }
      if (!(E > S)) { state = null; say(null); redraw(); paintTop(); return; }
      const t0 = tl.seconds(S), n = Math.max(2, Math.min(200000, Math.round(((tl.seconds(E) - t0) * 1000) / MSP)));
      const L = await readPeaks(lead, t0, n);
      const D = [];
      for (const tk of dbls) { const r = await readPeaks(tk, t0, n); D.push({ tk, lane: r.lane, peaks: r.peaks, missing: r.missing }); }
      if (my !== seq) return;
      state = { S, E, n, t0, lead: { tk: lead, peaks: L.peaks }, dbls: D };
      if (L.missing && L.missing === L.segs) say('noOverview', {}, 'bad', 6000); else if (!quiet) say('matching');
      await new Promise((r) => setTimeout(r, 10));
      const t1 = performance.now();
      recompute(false);
      note('matched', { n, ms: Math.round(performance.now() - t1), dbls: D.map((d) => ({ name: d.tk.name.value, before: Math.round(d.res.before), pieces: d.res.pieces.length, moved: d.res.moved })) });
      if ($('status').textContent === t('matching')) say(null);
    }

    // ---- Align: save a copy, cut, then move and stretch every piece ------------------------
    // A crossfade straight through LUNA's set_fade, as Fades does: centred on the join.
    async function crossfade(lane, a, b, L) {
      const commands = `${s.path}/contexts/main/commands`;
      const reply = await luna.raw.post(`${commands}/set_fade`, {
        session_uid: s.uid, fade_shape: 'equal_power',
        clips: [{ playlist_uid: a.playlistUid ?? lane.id, clip_uid: a.id, contributor_clip_uid: b.id, fade_type: 'cross_fade', start_offset: -Math.floor(L / 2), stop_offset: L - Math.floor(L / 2), trim_to_edge: false, fade_reference_edge: 'none' }],
      });
      const res = reply?.edit_results ?? {};
      return ((res.changed?.fades ?? []).length + (res.added?.fades ?? []).length) > 0;
    }
    // Duplicate the track's active version into a new one, then make the original active again.
    async function backup(tk, lane) {
      const v0 = lane.version.value, id0 = lane.id;
      say('backingUp', { name: tk.name.value });
      const mine = () => (s.playlists?.items ?? []).filter((p) => p.trackUid.value === tk.id);
      await s.playlists?.load?.().catch(() => undefined);
      const had = new Set(mine().map((p) => p.id));
      await s.newPlaylists([tk.id], { duplicate: true });
      let copy = null;
      for (let k = 0; k < 100 && !copy; k++) {
        await new Promise((r) => setTimeout(r, 50));
        if (k % 4 === 3) await s.playlists?.load?.().catch(() => undefined);
        copy = mine().find((p) => !had.has(p.id)) ?? null;
      }
      if (!copy) throw new Error('the copy did not appear');
      // LUNA may make the new version active: go back to the original to work on it.
      if (tk.playlistUid.value !== id0) {
        await s.setPlaylist(tk.id, v0);
        for (let k = 0; k < 100 && tk.playlistUid.value !== id0; k++) await new Promise((r) => setTimeout(r, 50));
        if (tk.playlistUid.value !== id0) throw new Error('could not go back to the original version');
      }
      await lane.clips.load();
      try { await copy.clips.load(); } catch { /* not fatal */ }
      note('backup', { track: tk.name.value, original: v0, copy: copy.version.value, clipsOriginal: lane.clips.items.length, clipsCopy: copy.clips.items.length });
      return { name: tk.name.value, v: copy.version.value };
    }
    async function apply() {
      if (busy || !state) return;
      busy = true; paintTop();
      const st = state;                                     // fixed for the whole run
      const keep = { S: ctx.selectionStart.value, E: ctx.selectionStop.value, T: [...(ctx.selectionTracks.value ?? [])] };
      const tickAt = (x) => Math.round(tl.tickAtSeconds(st.t0 + (x * MSP) / 1000));
      let failed = 0; const t0 = performance.now();
      $('doneBox').hidden = true;
      const runs = st.dbls.filter((d) => (d.res?.pieces ?? []).length);
      Object.assign(prog, { on: true, k: 0, n: Math.max(1, runs.length), t0 }); progress('copy', 0);
      let steps = 0, total = 0; const backups = [];
      const nearTicks = Math.max(1, tickAt(0.2) - tickAt(0));     // 1 ms
      try {
        for (const d of st.dbls) {
          const ps = (d.res?.pieces ?? []).filter(() => true);
          if (!ps.length) continue;
          progress('copy', 0);
          const lane = d.lane;
          // A safety copy first: the double's current version is duplicated into a new version
          // (V2, or the next number) that is never edited, and the original is made active again
          // to work on. Not counted for Undo, so Undo never takes the copy away.
          try { backups.push(await backup(d.tk, lane)); paintTop(); } catch (e) { note('backup failed', { e: errText(e) }); say('backupFailed', { e: errText(e) }, 'bad', 9000); throw e; }
          const cuts = [...new Set(ps.flatMap((p) => [tickAt(p.a), tickAt(p.b)]))].sort((x, y) => x - y);
          const before = lane.clips.items.length;
          progress('cut', 0);
          await lane.split(cuts); steps++;
          progress('cut', 1);
          for (let k = 0; k < 40 && lane.clips.items.length === before; k++) { await new Promise((r) => setTimeout(r, 50)); await lane.clips.load(); }
          // Pieces that need to change, latest first when they move right and earliest first when
          // they move left would avoid overlaps; overlaps are only layers on the way and are gone
          // at the end, so plain order is fine.
          let i = 0;
          for (const p of ps) {
            i++;
            say('working', { name: d.tk.name.value, i, n: ps.length }); progress('pieces', i / ps.length);
            const a = tickAt(p.a), b = tickAt(p.b), ta = tickAt(p.ta), tb = tickAt(p.tb);
            if (Math.abs(ta - a) < nearTicks && Math.abs(tb - b) < nearTicks) continue;
            // The clip that is this piece: it holds the piece's middle and ends within 5 ms of it
            // (a clip's own edge need not fall on the 5 ms grid).
            const mid = (a + b) / 2, slack = nearTicks * 6;
            const c = lane.clips.items.find((x) => x.start.value <= mid && x.stop.value >= mid && Math.abs(x.start.value - a) <= slack && Math.abs(x.stop.value - b) <= slack);
            if (!c) { note('piece not found', { a, b }); continue; }
            const k = (tb - ta) / Math.max(1, b - a);
            const na = Math.round(ta + (c.start.value - a) * k), nb = Math.round(tb + (c.stop.value - b) * k);
            const sameLen = Math.abs((nb - na) - (c.stop.value - c.start.value)) < nearTicks;
            try {
              if (sameLen) { try { await c.move(na); } catch (e) { note('move fell back to trim', { e: errText(e) }); await c.trim(na, nb, { stretch: true }); } }
              else await c.trim(na, nb, { stretch: true });
              steps++; total++;
            } catch (e) { failed++; steps++; note('piece failed', { i, a, b, na, nb, e: errText(e) }); }
          }
          // Every join between two pieces gets a short equal-power crossfade, so no cut clicks.
          const xL = Math.max(1, tickAt(0.8) - tickAt(0));            // 4 ms
          let joins = 0;
          for (let q = 0; q + 1 < ps.length; q++) {
            if (ps[q].b !== ps[q + 1].a) continue;
            const at = tickAt(ps[q].tb), slack = nearTicks * 3;
            const A1 = lane.clips.items.find((x) => Math.abs(x.stop.value - at) <= slack && x.start.value < at);
            const B1 = lane.clips.items.find((x) => x !== A1 && Math.abs(x.start.value - at) <= slack && x.stop.value > at);
            if (!A1 || !B1) { note('join not found', { at }); continue; }
            if (q % 10 === 0) say('joining', { i: q + 1, n: ps.length - 1 });
            if (q % 5 === 0) progress('joins', q / Math.max(1, ps.length - 1));
            try { if (await crossfade(lane, A1, B1, xL)) { steps++; joins++; } } catch (e) { note('crossfade failed', { at, e: errText(e) }); }
          }
          note('joins', { track: d.tk.name.value, joins });
          // Consolidate: the aligned span of the double becomes one clip again (LUNA's own
          // Consolidate, on the double alone, from the first piece to the last).
          if (opts.cons) {
            say('consolidating', { name: d.tk.name.value }); progress('cons', 0);
            const from = Math.min(tickAt(ps[0].a), tickAt(ps[0].ta)), to = Math.max(tickAt(ps[ps.length - 1].b), tickAt(ps[ps.length - 1].tb));
            const t1 = performance.now();
            try {
              await s.selectTimeline({ tracks: [d.tk], startTick: from, stopTick: to });
              await ctx.consolidate(); steps++;
              const inSpan = () => lane.clips.items.filter((c) => c.stop.value > from && c.start.value < to).length;
              const until = performance.now() + (window.__alignConsMaxMs ?? 90000);   // LUNA renders it: wait for one clip, up to 90 s
              for (let k = 0; inSpan() > 1 && performance.now() < until; k++) { await new Promise((r) => setTimeout(r, 200)); if (k % 5 === 4) await lane.clips.load(); }
              progress('cons', 1);
              note('consolidated', { track: d.tk.name.value, clips: inSpan(), secs: Math.round((performance.now() - t1) / 1000) });
            } catch (e) { note('consolidate failed', { e: errText(e) }); }
          }
          prog.k++;
        }
        undoSteps = steps; lastBackups = backups.map((b, k) => ({ ...b, tk: st.dbls.filter((d) => (d.res?.pieces ?? []).length)[k]?.tk }));
        note('applied', { steps, total, failed, secs: Math.round((performance.now() - t0) / 1000) });
        say(failed ? 'doneSome' : 'done', { n: st.dbls.length, p: total, f: failed, v: backups.map((b) => `V${b.v}`).join(', ') }, failed ? 'bad' : 'ok', 15000);
        finish(!failed, $('status').textContent);
      } catch (e) { undoSteps = steps; note('apply failed', { e: errText(e) }); say('failed', { e: errText(e) }, 'bad', 9000); finish(false, $('status').textContent); }
      try { await ctx.selectionTracks.set(keep.T); if (typeof keep.S === 'number') { await ctx.selectionStart.set(keep.S); await ctx.selectionStop.set(keep.E); } } catch (e) { note('selection not restored', { e: errText(e) }); }
      await new Promise((r) => setTimeout(r, 150));
      busy = false; quietUntil = performance.now() + 3000;
      await refresh(true);
    }
    $('apply').onclick = () => void apply();
    // Back to original: make the unedited copy saved before aligning the active version again.
    $('undo').onclick = async () => {
      if (!lastBackups.length || busy) return;
      busy = true; paintTop();
      try {
        for (const b of lastBackups) if (b.tk) await s.setPlaylist(b.tk.id, b.v);
        note('restored', { to: lastBackups.map((b) => ({ track: b.name, v: b.v })) });
        say('restored', { v: lastBackups.map((b) => `V${b.v}`).join(', ') }, 'ok', 9000);
        lastBackups = [];
      } catch (e) { note('restore failed', { e: errText(e) }); say('failed', { e: errText(e) }, 'bad', 9000); }
      busy = false; quietUntil = performance.now() + 3000;
      await new Promise((r) => setTimeout(r, 300));
      await refresh(true);
    };
    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const report = { addOn: 'V-Align', version: VERSION, luna: luna?.version?.value ?? null, platform: navigator.platform, lang, opts, session: { tracks: (state?.dbls ?? []).map((d) => d.tk.name.value), lead: state?.lead?.tk?.name?.value ?? null, seconds: state ? Math.round((state.n * MSP) / 1000) : 0 }, log };
      try { if (await AddOnCopy(JSON.stringify(report, null, 2))) say('report', {}, 'ok', 5000); } catch { /* nothing */ }
    };
    let timer;
    let quietUntil = 0;   // right after a run, re-reads keep the result message on screen
    const later = () => { if (busy) return; clearTimeout(timer); timer = setTimeout(() => { if (!busy) void refresh(performance.now() < quietUntil); }, 200); };
    for (const p of [ctx.selectionStart, ctx.selectionStop, ctx.selectionTracks]) p?.onChange?.(later);
    await refresh();
  }

  (async () => {
    for (;;) { try { luna = await Luna.connect(); break; } catch { say('waiting'); await new Promise((r) => setTimeout(r, 1500)); } }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
    tour ??= window.AddOnTour?.attach({
      button: $('help'), key: `${KEY}tourSeen`,
      labels: () => ({ next: t('tNext'), back: t('tBack'), skip: t('tSkip'), done: t('tDone') }),
      language: {
        sel: '#lang',
        list: () => Object.keys(I18N).map((c) => [c, I18N[c]._name]),
        current: () => lang,
        set: (c) => { $('lang').value = c; $('lang').dispatchEvent(new Event('change')); },
        title: () => t('langT'), text: () => t('langX'),
      },
      steps: () => [
        { sel: '#lead', title: () => t('g1t'), text: () => t('g1') },
        { sel: '#rows', title: () => t('g2t'), text: () => t('g2') },
        { sel: '#prec', title: () => t('g3t'), text: () => t('g3') },
        { sel: '#apply', title: () => t('g4t'), text: () => t('g4') },
        { sel: '#undo', title: () => t('g5t'), text: () => t('g5') },
        { sel: '#ver', title: () => t('g6t'), text: () => t('g6') },
        { sel: '#help', title: () => t('zt'), text: () => t('z') },
      ],
    });
  })();
})();
