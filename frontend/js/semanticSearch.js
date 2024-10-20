document.addEventListener('DOMContentLoaded', function() {
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
     
        // Sort by distance ascending (highest relevance first)
        results.sort((a, b) => b.distance - a.distance);
     
        const ul = document.createElement('ul');
        results.forEach(result => {
            const li = document.createElement('li');
            const relevance = result.distance.toFixed(4); // Remove 1 - conversion
            li.innerHTML = `
                <span class="file-name">${result.name}</span> 
                (${result.type}) - Relevance: ${relevance}
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