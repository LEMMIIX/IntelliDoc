// @Autor Luca Neumann, Miray-Eren Kilic
document.addEventListener('DOMContentLoaded', async function() {
    const folderTreeDiv = document.getElementById('folderTree');
    const filePreviewDiv = document.getElementById('filePreview');
    const errorContainer = document.getElementById('error-container');
    const successContainer = document.getElementById('success-container');
    //const parentFolderSelect = document.getElementById('parentFolderSelect'); 


    // @Autor Luca Neumann
    async function fetchAndRenderFolderTree() {
        try {
            const response = await fetch('/api/folders/tree');
            if (!response.ok) {
                throw new Error('Failed to fetch folder tree');
            }
            const folderTree = await response.json();
            renderFolderTree(folderTree, folderTreeDiv);
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Failed to load folder structure. Please try again later.');
        }
    }

    async function populateFolderSelect() {
        try {
            const response = await fetch('/api/folders/');
            console.log('Response Status:', response.status); // Debugging
            const parentFolders = await response.json();
            console.log('Parent Folders:', parentFolders); // Debugging
    
            parentFolderSelect.innerHTML = '<option value="">Kein übergeordneter Ordner</option>';
            
            parentFolders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.folder_id;
                option.textContent = folder.folder_name;
                parentFolderSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching parent folders:', error);
        }
    }
    

    function renderFolderTree(folders, container) {
        container.innerHTML = '';
        folders.forEach(folder => {
            const folderElement = createFolderElement(folder);
            container.appendChild(folderElement);
        });
    }

    function createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';

        const folderName = document.createElement('span');
        folderName.textContent = folder.name;
        folderName.className = 'folder-toggle';
        folderName.addEventListener('click', () => toggleFolder(folderDiv));
        folderDiv.appendChild(folderName);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'folder-contents';
        contentDiv.style.display = 'none';

        folder.files.forEach(file => {
            const fileElement = createFileElement(file);
            contentDiv.appendChild(fileElement);
        });

        if (folder.children && folder.children.length > 0) {
            const childrenContainer = document.createElement('div');
            renderFolderTree(folder.children, childrenContainer);
            contentDiv.appendChild(childrenContainer);
        }

        folderDiv.appendChild(contentDiv);
        return folderDiv;
    }

    function createFileElement(file) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';

        const fileName = document.createElement('span');
        fileName.textContent = file.name;
        fileName.addEventListener('click', () => previewFile(file.name));
        fileDiv.appendChild(fileName);

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => downloadFile(file.name));
        fileDiv.appendChild(downloadBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteFile(file.id));
        fileDiv.appendChild(deleteBtn);

        return fileDiv;
    }

    function toggleFolder(folderDiv) {
        const contentDiv = folderDiv.querySelector('.folder-contents');
        contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
    }

    // Funktion zum Löschen eines Ordners
    async function deleteFolder(folderId) {
        if (confirm('Are you sure you want to delete this folder?')) {
            try {
                const response = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error('Failed to delete folder');
                }
                const data = await response.json();
                showSuccessMessage(data.message);
                fetchAndRenderFolderTree(); // Aktualisiert die Ordnerstruktur
            } catch (error) {
                console.error('Error deleting folder:', error);
                showErrorMessage('Failed to delete folder. Please try again later.');
            }
        }
    }

    function createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';
    
        const folderName = document.createElement('span');
        folderName.textContent = folder.name;
        folderName.className = 'folder-toggle';
        folderName.addEventListener('click', () => toggleFolder(folderDiv));
        folderDiv.appendChild(folderName);
    
        // Löschen-Schaltfläche hinzufügen
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Folder';
        deleteBtn.addEventListener('click', () => deleteFolder(folder.id));
        folderDiv.appendChild(deleteBtn);
    
        const contentDiv = document.createElement('div');
        contentDiv.className = 'folder-contents';
        contentDiv.style.display = 'none';
    
        folder.files.forEach(file => {
            const fileElement = createFileElement(file);
            contentDiv.appendChild(fileElement);
        });
    
        if (folder.children && folder.children.length > 0) {
            const childrenContainer = document.createElement('div');
            renderFolderTree(folder.children, childrenContainer);
            contentDiv.appendChild(childrenContainer);
        }
    
        folderDiv.appendChild(contentDiv);
        return folderDiv;
    }

    // @Autor Miray-Eren Kilic
    let currentlyPreviewedFile = null;

    async function previewFile(fileName) {
        const filePreview = document.getElementById('filePreview');
    
        // Überprüfen, ob die Vorschau gerade die Datei anzeigt, auf die geklickt wurde
        if (currentlyPreviewedFile === fileName) {
            // Vorschau ausblenden, wenn dieselbe Datei erneut geklickt wird
            filePreview.innerHTML = '';
            filePreview.style.display = 'none'; // Vorschau unsichtbar machen
            currentlyPreviewedFile = null; // Datei-Tracking zurücksetzen
            return;
        }
    
        // Neue Datei wird angeklickt, also Vorschau aktualisieren
        currentlyPreviewedFile = fileName;
    
        try {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                // Bildvorschau
                filePreview.innerHTML = `<img src="/api/docupload/view/${encodeURIComponent(fileName)}" alt="Bildvorschau" style="max-width: 100%; height: auto; display: block; object-fit: contain; width: 500px; height: 300px;">`;
    
            } else if (['pdf'].includes(fileExtension)) {
                // PDF-Vorschau
                filePreview.innerHTML = `<iframe src="/api/docupload/view/${encodeURIComponent(fileName)}" frameborder="0" width="100%" height="600px"></iframe>`;
    
            } else if (fileExtension === 'txt') {
                // Textdatei-Vorschau
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const textContent = await response.text();
                
                // Textinhalt in ein div einfügen und Zeilenumbrüche beibehalten
                filePreview.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${textContent}
                    </div>
                `;
            } else if (fileExtension === 'docx') {
                // DOCX-Vorschau
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const docxContent = await response.text(); // Der Server liefert HTML zurück
                
                // DOCX-Inhalt im HTML-Format anzeigen
                filePreview.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${docxContent}
                    </div>
                `;
            } else {
                // Vorschau für andere Dateitypen
                filePreview.innerHTML = `<p>Datei: ${fileName}</p>`;
            }
    
            filePreview.style.display = 'block'; // Vorschau sichtbar machen
        } catch (error) {
            console.error('Fehler beim Laden der Datei:', error);
        }
    }

    
function downloadFile(fileName) {
        fetch(`/api/docupload/download/${encodeURIComponent(fileName)}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
                a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Download error:', error);
            showErrorMessage('Failed to download file. Please try again later.');
        });
}

    async function deleteFile(fileId) {
        if (confirm('Are you sure you want to delete this file?')) {
            try {
                const response = await fetch(`/api/docupload/delete/${fileId}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error('Failed to delete file');
                }
                const data = await response.json();
                showSuccessMessage(data.message);
                filePreview.innerHTML = '';
                filePreview.style.display = 'none'; 
                currentlyPreviewedFile = null;
                fetchAndRenderFolderTree();
            } catch (error) {
                console.error('Error:', error);
                showErrorMessage('Failed to delete file. Please try again later.');
            }
        }
    }

    function showErrorMessage(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    function showSuccessMessage(message) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 5000);
    }

    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', function() {
            window.location.href = '/api/docupload';
        });
    }

fetchAndRenderFolderTree();

// @Autor Luca Neumann
// Ordner abrufen und Dropdown Menü damit ausfüllen
await populateFolderSelect();


if (createFolderForm) {
    createFolderForm.addEventListener('submit', function(e) {
        e.preventDefault();  // Verhindert das Standardverhalten des Formulars (Neuladen der Seite)
        console.log('Form submit event fired');  // Debugging: Bestätige, dass das Submit-Event gefeuert wird

        const folderName = document.getElementById('folderNameInput').value;
        const parentFolderId = document.getElementById('parentFolderSelect').value;

        console.log('Folder Name Input Value:', folderName);  // Debugging: Überprüfe den eingegebenen Ordnernamen
        console.log('Parent Folder Select Value:', parentFolderId);  // Debugging: Überprüfe den Wert des ausgewählten Elternordners

        fetch('/api/folders/create', {  // Überprüfe den Endpunkt (angepasst für POST-Route)
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderName, parentFolderId })
        })
        .then(response => {
            console.log('Fetch response:', response);  // Debugging: Überprüfe die Response vom Server
            return response.json();
        })
        .then(data => {
            console.log('Response Data:', data);  // Debugging: Überprüfe die Daten, die vom Server zurückgegeben werden
            if (data.folderId) {
                alert('Folder created successfully');
                location.reload(); // Seite neu laden, um die neue Ordnerstruktur anzuzeigen
            } else {
                alert(data.message || 'Error creating folder');
            }
        })
        .catch(error => {
            console.error('Error creating folder:', error);  // Debugging: Fehlerprotokollierung bei der Anfrage
        });
    });
} else {
    console.error('Create Folder Form not found');  // Debugging: Fehlerprotokollierung, wenn das Formular nicht gefunden wird
}
});
