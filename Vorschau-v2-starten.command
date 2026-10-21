#!/bin/bash
# AYLOUL v2 (Praesentationsseite): Vorschau starten (Doppelklick im Finder).
# Baut die zweite Designrichtung im Ordner v2/ und oeffnet sie unter http://127.0.0.1:4322/
# Dieses Fenster offen lassen, solange die Vorschau laufen soll. Beenden: Fenster schliessen oder ctrl+C.

cd "$(dirname "$0")/v2" || exit 1
PORT=4322
ADRESSE="http://127.0.0.1:$PORT/"

warten_und_beenden() {
  echo ""
  read -r -p "Zum Schliessen die Eingabetaste druecken ... " _
  exit "$1"
}

echo "=============================================="
echo "  AYLOUL v2 - Praesentationsseite"
echo "=============================================="
echo ""

# 1. Node.js vorhanden?
if ! command -v node >/dev/null 2>&1; then
  # Homebrew-Pfade ergaenzen (Terminal-Fenster aus dem Finder kennen sie manchmal nicht)
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js ist auf diesem Mac nicht installiert."
  echo ""
  echo "Bitte Node.js (aktuelle LTS-Version, mindestens 22.22) installieren:"
  echo "  https://nodejs.org/"
  echo "Dort den Installer fuer macOS herunterladen und ausfuehren."
  echo "Danach diese Datei noch einmal doppelklicken."
  warten_und_beenden 1
fi

NODE_VERSION="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_MINOR="$(echo "$NODE_VERSION" | cut -d. -f2)"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 22 ]; }; then
  echo "Node.js $NODE_VERSION ist zu alt. Benoetigt wird Version 22.22 oder neuer."
  echo "Bitte die aktuelle LTS-Version installieren: https://nodejs.org/"
  warten_und_beenden 1
fi
echo "Node.js $NODE_VERSION gefunden."

# 2. Pakete installieren, falls noch nicht geschehen
if [ ! -d node_modules ]; then
  echo ""
  echo "Erster Start: Pakete werden installiert (einmalig, dauert 1-3 Minuten, Internet noetig) ..."
  if ! npm install; then
    echo ""
    echo "Die Installation ist fehlgeschlagen. Bitte Internetverbindung pruefen und erneut starten."
    warten_und_beenden 1
  fi
fi

# 3. Laeuft schon eine Vorschau auf dem Port?
if curl -s -o /dev/null "$ADRESSE"; then
  echo ""
  echo "Die Vorschau laeuft bereits. Browser wird geoeffnet."
  open "$ADRESSE"
  warten_und_beenden 0
fi

# 4. Website bauen
echo ""
echo "Website wird gebaut ..."
if ! npm run build; then
  echo ""
  echo "Beim Bauen ist ein Fehler aufgetreten (siehe oben)."
  warten_und_beenden 1
fi

# 5. Vorschau starten und Browser oeffnen
echo ""
echo "Vorschau startet unter $ADRESSE"
npm run preview &
VORSCHAU_PID=$!
# Beim Schliessen des Fensters die Vorschau beenden (auch wenn Astro sie im Hintergrund fuehrt)
trap 'kill $VORSCHAU_PID 2>/dev/null; npx astro preview stop >/dev/null 2>&1' EXIT

for _ in $(seq 1 30); do
  if curl -s -o /dev/null "$ADRESSE"; then break; fi
  sleep 1
done
open "$ADRESSE"

echo ""
echo "Die Praesentationsseite ist geoeffnet: $ADRESSE"
echo "(Die erste Fassung startet separat mit Vorschau-starten.command auf Port 4321.)"
echo ""
echo "Dieses Fenster offen lassen. Zum Beenden das Fenster schliessen oder ctrl+C druecken."
wait $VORSCHAU_PID
# Falls Astro den Server in den Hintergrund verlegt hat: Fenster offen halten, solange er antwortet
while curl -s -o /dev/null "$ADRESSE"; do sleep 5; done
