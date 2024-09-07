# Backend

Im backend wird Nodejs mit Express als primäre Sprache/Framework eingesetzt.

## User

Zugriff auf die eigenen Daten erfolgt bei jedem Nutzer üder seine user_id.

### Registrierung

1. Der Nutzer wird beim registrieren aufgefordert, einen Nutzernamen, E-Mail und Passwort mit entsprechender Stärke einzugeben.
2. Das Passwort wird mit bcrypt gehashed
3. Die Werte werden in die Tabelle "main.users" geschrieben, die user_id wird um 1 erhöht

### Login

1. Der Nutzer wird aufgefordert Nutzername und Passwort einzugeben
2. Die Zeile in der Tabelle "main.users" wird anhand des eingegebenen Nutzernamens selektiert
3. Das eingegebene Passwort wird gehashed und dieses mit dem Eintrag in der Zeile der Tabelle verglichen
4. Stimmen die Daten überein wird eine session erzeugt, anhand der user_id in der Tabelle "main.users"
5. Ein Cookie wird für den Nutzer bereitgestellt (--- Dies evtl. ersetzen durch eine Token-basierte Sitzungsverifikation)