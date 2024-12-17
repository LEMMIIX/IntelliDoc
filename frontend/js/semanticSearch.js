/**
 * Diese Datei enthält die Logik für die semantische Suche//Endpoint für frontend.
 * Sie ermöglicht die Durchführung von Suchanfragen und die Anzeige der Suchergebnisse mit einer Vorschau der Dateien.
 *
 * @autor Lennart. 
 * 
 */
document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const filePreviewDiv = document.getElementById('filePreview');

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            performSemanticSearch(query);
        }
    });

    async function performSemanticSearch(query) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const results = await response.json();
            displaySearchResults(results);
        } catch (error) {
            console.error('Error during semantic search:', error);
            searchResults.innerHTML = '<p>An error occurred during the search. Please try again.</p>';
        }
    }

    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No results found.</p>';
            return;
        }
    
        // Sortiere die Ergebnisse nach Relevanz (höchste zuerst)
        results.sort((a, b) => b.distance - a.distance);
    
        const bestScore = results[0].distance; // Höchster Score im Set
        const worstScore = results[results.length - 1].distance; // Niedrigster Score im Set
        const scoreRange = bestScore - worstScore; // Spannweite der Scores
    
        const ul = document.createElement('ul');
    
        results.forEach((result, index) => {
            const relevance = result.distance.toFixed(2);
    
            // Normalisiere den Score auf eine Skala von 0 bis 1
            const normalizedScore = scoreRange > 0 ? (result.distance - worstScore) / scoreRange : 1;
    
            // Dynamische Sterne-Bewertung basierend auf relativer Position und absolutem Wert
            let starsText;
            if (index === 0 && bestScore >= 50) {
                // Bestes Ergebnis über 50 %: 3 Sterne in Blau
                starsText = "★★★ (Blau)";
            } else if (bestScore >= 30 && result.distance >= 30) {
                // Ergebnisse über 30 % (relativ gesehen): 2 Sterne oder mehr
                starsText = normalizedScore >= 0.75 ? "★★★" : "★★";
            } else {
                // Geringe Relevanz: 1 Stern in Gelb für alles unter 30 %
                starsText = "★";
            }
    
            // Ergebnis-Element erstellen
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${result.name}</span> 
                (${result.type}) - Relevance: ${relevance}% - Sterne: ${starsText}
            `;
            li.querySelector('.file-name').addEventListener('click', () => previewFile(result.name));
            ul.appendChild(li);
        });
    
        searchResults.appendChild(ul);
    }
    
    

    let currentlyPreviewedFile = null;

    async function previewFile(fileName) {
        if (currentlyPreviewedFile === fileName) {
            filePreviewDiv.innerHTML = '';
            filePreviewDiv.style.display = 'none';
            currentlyPreviewedFile = null;
            return;
        }

        currentlyPreviewedFile = fileName;

        try {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                filePreviewDiv.innerHTML = `<img src="/api/docupload/view/${encodeURIComponent(fileName)}" alt="Image preview" style="max-width: 100%; height: auto; display: block; object-fit: contain; width: 500px; height: 300px;">`;
            } else if (['pdf'].includes(fileExtension)) {
                filePreviewDiv.innerHTML = `<iframe src="/api/docupload/view/${encodeURIComponent(fileName)}" frameborder="0" width="100%" height="600px"></iframe>`;
            } else if (fileExtension === 'txt') {
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const textContent = await response.text();
                filePreviewDiv.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${textContent}
                    </div>
                `;
            } else if (fileExtension === 'docx') {
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const docxContent = await response.text();
                filePreviewDiv.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${docxContent}
                    </div>
                `;
            } else {
                filePreviewDiv.innerHTML = `<p>File: ${fileName}</p>`;
            }

            filePreviewDiv.style.display = 'block';
        } catch (error) {
            console.error('Error loading file:', error);
            filePreviewDiv.innerHTML = '<p>Error loading file preview.</p>';
        }
    }
});