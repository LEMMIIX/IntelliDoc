# Code Conventions IntelliDoc

## Formatierung:
-	**Einrückung mit Tabs**: Benutze für die Einrückung des Codes Tabs und keine Leerzeichen.
-	**Kein Whitespace**: Säubere vor jedem Commit alle nachfolgenden Leerzeichen im Code.
-	**Semikolons**: Verwende im Code konsequent Semikolons, um die Lesbarkeit und Wartbarkeit des Codes zu gewährleisten. 
-	**Zeilenlänge von 80**: Halte dich an eine Zeilenlänge von maximal 80 Zeichen für bessere Lesbarkeit
-	**Doppelte Anführungszeichen verwenden**: <br>

 	Richtig: <br>
    <pre><code>var foo = "bar;"</code></pre>
 	Falsch:
    <pre><code>var foo = 'bar';</code></pre> 
    
-	**Setze geschweifte Klammern in stets in dieselbe Zeile** <br>
 	Richtig: 
<pre><code>if (true) {
  console.log('winning');
}</code></pre>
  Falsch:
<pre><code>if (true)
{
  console.log('losing');
}</code></pre> 

-	**Deklariere pro var-Anweisung eine Variable**. Dadurch wird es einfacher, die Zeilen neu anzuordnen. <br>

 	Richtig: 
<pre><code>var keys   = ['foo', 'bar'];
var valuesOf... = [23, 42];
var ...Object = {};
</code></pre>
  Falsch:
<pre><code>var keys = ['foo', 'bar'],
       values = [23, 42],
       object = {};</code></pre>
    
## Namenskonventionen
-	Verwende **lowerCamelCase** für Variablen, Properties und Funktionsnamen. Die Namen sollten außerdem beschreibend sein, einzelzeichen-Variablen und unübliche Abkürzungen sollten grundsätzlich vermieden werden. <br>
Richtig:
<pre><code>var selectAdminUser = db.query('SELECT * FROM users ...');</code></pre>
Falsch: 
<pre><code>var user = db.query('SELECT * FROM users ...');</code></pre>

-	Klassennamen sollten mit **UpperCamelCase** geschrieben und großgeschrieben werden. <br>
Richtig:
<pre><code>function BankAccount() {…}</code></pre>
Falsch: 
<pre><code>function bank_Account() {…}</code></pre>

## Kommentare
-	Kommentare sollten nur hinzugefügt werden, wenn sie unerlässlich sind. Nach Absprache zur automatischen Dokumentation TypeDoc verwenden.
-	Blockkommentare sind auf gleicher Einrückungsebene wie der umgebende Code. Sie können im Stil /* ... / oder // ... verwendet werden. Bei mehrzeiligen / ... */ Kommentaren müssen nachfolgende Zeilen mit einem * beginnen, das mit dem * auf der vorherigen Zeile ausgerichtet ist.
Beispiele:
/*
 * Das ist        // Und das          /* Oder auch
 * erlaubt       // hier auch.        * sowas. */*/

## Autoren
Autoren müssen in jeder Klasse mit dem Tag '@Author' markiert werden.

## Refactoring
- Um den Code lesbar zu halten, soll der Code vor allem **vor einer Feature Implementierung** refaktoriert werden.<br>
  Zum Refactoring gehören:
  - Variablen/Methodennamen den Konventionen entsprechend umbenennen
  - Unnötige Variablen entfernen
  - Code extrahieren
  - Code ersetzen

 ### Variablen/Methodennamen umbenennen
 Vor dem Refactoring:
 <pre><code>String[] name = {Henning Ahlf, Kolja Dunkel};</code></pre>
 Nach dem Refactoring:
 <pre><code>int[] profNameArray = {Henning Ahlf, Kolja Dunkel};</code></pre>
 
 ### Unnötige Variablen entfernen
 Vor dem Refactoring:
 <pre><code>String helloWorld = "Hello World";
System.out.println(helloWorld);</code></pre>
 Nach dem Refactoring:
 <pre><code>System.out.println("Hello World");</code></pre>

 ### Code extrahieren
 Vor dem Refactoring:
 <pre><code>public static String gibFarbe(int wert) {
        int teilwert = 255 / (farben.length - 1);
        String s = farben[(int) (((double) wert / (double) teilwert) + 0.5];
    }</code></pre>
 
 Nach dem Refactoring:
 <pre><code>public static String gibFarbe(int wert) {
        int teilwert = 255 / (farbArrayLaenge() - 1);
        String s = farben[calcIndexMitRundung(wert, teilwert)];
    }
 
 private static int farbArrayLaenge() {
            return farben.length;
    }

private static int calcIndexMitRundung(int wert, int teilwert) {
            return (int) (
                    ((double) wert / (double) teilwert)
                            + 0.5
                );
    }</code></pre>

 ### Code ersetzen
 Vor dem Refactoring:
 <pre><code>double basePrice = quantity * itemPrice;
double discountFactor;
if(basePrice > 1000) { discountFactor = 0.95; } else { discountFactor = 0.98;
double price = basePrice * discountFactor;</code></pre>

Nach dem Refactoring;
<pre><code>double price = quantity * itemPrice
                        * ((quantity * itemPrice > 1000) ? 0.95
                                                          : 0.98);</code></pre>
                                                          
## Richtiger Beispielcode (in Java) nach den Konventionen

<pre><code>public class ImageToASCIITest {
    /**
     * Eine Klasse, die eine Idee zur Konvertierung von Farbwerten in bestimmte ASCII Zeichen testet.
     */

    private static String[] farben = new String[]{"weiß", "rot", "blau", "grün", "lila", "gelb", "schwwarz", "magenta", "rosagepunktet"};

    public static String gibFarbe(int farbWert) {
        int teilwert = 255 / (farbArrayLaenge() - 1);
        String s = farben[calcIndexMitRundung(farbWert, teilwert)];

        //printKontrollwert(farbWert);
        return wert + "\t\t" + s;
    }

    private static int farbArrayLaenge() {
            return farben.length;
    }

    private static int calcIndexMitRundung(int farbWert, int teilwert) {
            return (int) (
                    ((double) farbWert / (double) teilwert)
                            + 0.5
                );
    }

    private static void printKontrollwert(int farbWert) {
        System.out.println("\nWert:\t" + farbWert);
    }

    public static void main(String[] args) {
        /**
         * Mit einem Eingabewert soll ein entsprechender Index in einem Array berechnet und dessen
         * Inhalt ausgegeben werden
         *
         * Farbwert [0, 255]
         */

        for (int i = 0; i < 255; i++) {
            System.out.println(gibFarbe(i));
        }
    }
}</code></pre>
