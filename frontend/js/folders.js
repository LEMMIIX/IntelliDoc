/**
 * Diese Datei enthält die Logik für die Verwaltung der Ordnerstruktur.
 * Sie ermöglicht das Abrufen, Erstellen, Umbenennen und Löschen von Ordnern sowie das Vorschauen und Verwalten von Dateien.
 *
 * @autor Luca, Miray, Ilyass
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

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
    
            const { folderTree, unassignedFiles } = await response.json();
    
            renderFolderTree(folderTree, folderTreeDiv);
    
            // Datein ohne Ordner rendern
            if (unassignedFiles.length > 0) {
                const unassignedFilesContainer = document.createElement('div');
                unassignedFilesContainer.innerHTML = '<h3>Datein ohne Ordner:</h3>';
    
                unassignedFiles.forEach(file => {
                    const fileElement = createFileElement(file);
                    unassignedFilesContainer.appendChild(fileElement);
                });
    
                folderTreeDiv.appendChild(unassignedFilesContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Failed to load folder structure. Please try again later.');
        }
    }
    

    async function populateFolderSelect() {
        try {
            const response = await fetch('/api/folders/');
            //('Response Status:', response.status); // Debugging
            const parentFolders = await response.json();
            //console.log('Parent Folders:', parentFolders); // Debugging
    
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

        // Löschen-Schaltfläche hinzufügen
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Folder';
        deleteBtn.addEventListener('click', () => deleteFolder(folder.id, folder.name));
        folderDiv.appendChild(deleteBtn);

        // Umbenennen-Schaltfläche hinzufügen
        const renameBtn = document.createElement('button');
        renameBtn.textContent = 'Rename Folder';
        renameBtn.addEventListener('click', () => renameFolder(folder.id, folder.name));
        folderDiv.appendChild(renameBtn);

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

        const renameBtn = document.createElement('button');
        renameBtn.textContent = 'Rename';
        renameBtn.addEventListener('click', () => renameDocument(file.id, file.name));
        fileDiv.appendChild(renameBtn);

        return fileDiv;
    }

    function toggleFolder(folderDiv) {
        const contentDiv = folderDiv.querySelector('.folder-contents');
        contentDiv.style.display = contentDiv.style.display === 'none' ? 'block' : 'none';
    }

    // Funktion zum Löschen eines Ordners
    async function deleteFolder(folderId, folderName) {
        // Bestätigungsnachricht mit Ordnernamen
        const confirmationMessage = `Bist du sicher, dass du den Ordner "${folderName}" löschen möchtest? Alle darin enthaltenen Unterordner und Dateien werden ebenfalls unwiderruflich gelöscht.`;
        
        if (confirm(confirmationMessage)) {
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
    
    
    // @Autor Miray-Eren Kilic
    let currentlyPreviewedFile = null;

    async function previewFile(fileName) {
        const filePreview = document.getElementById('filePreview');
    
        if (currentlyPreviewedFile === fileName) {
            filePreview.innerHTML = '';
            filePreview.style.display = 'none'; 
            currentlyPreviewedFile = null;
            return;
        }
    
        currentlyPreviewedFile = fileName;
    
        try {
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                filePreview.innerHTML = `<img src="/api/docupload/view/${encodeURIComponent(fileName)}" alt="Bildvorschau" style="max-width: 100%; height: auto; display: block; object-fit: contain; width: 500px; height: 300px;">`;
    
            } else if (['pdf'].includes(fileExtension)) {
                filePreview.innerHTML = `<iframe src="/api/docupload/view/${encodeURIComponent(fileName)}" frameborder="0" width="100%" height="600px"></iframe>`;
    
            } else if (fileExtension === 'txt') {
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const textContent = await response.text();
                
                filePreview.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${textContent}
                    </div>
                `;
            } else if (fileExtension === 'docx') {
                const response = await fetch(`/api/docupload/view/${encodeURIComponent(fileName)}`);
                const docxContent = await response.text(); 
                
                filePreview.innerHTML = `
                    <div style="background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd;">
                        ${docxContent}
                    </div>
                `;
            } else {
                filePreview.innerHTML = `<p>Datei: ${fileName}</p>`;
            }
    
            filePreview.style.display = 'block'; 
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
}//@author Ilyass Dablaq
    function renameDocument(documentId, oldFilename) {
        const newFilename = prompt("Geben Sie einen neuen Dateinamen ein:", oldFilename);
        if (newFilename) {
            fetch('/api/folders/rename', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documentId, newFilename })
            })
                .then(async response => {
                    if (!response.ok) {
                        // Handle HTTP error responses like 400, 500
                        const errorMessage = await response.text(); // Get error message from server
                        throw new Error(`Error ${response.status}: ${errorMessage}`);
                    }
                    return response.json(); // Parse successful response
                })
                .then(data => {
                    // If rename was successful, notify the user and refresh the folder structure
                    //alert('Dokument erfolgreich umbenannt');
                    fetchAndRenderFolderTree(); // Reload folder structure
                })
                .catch(error => {
                    console.error('Error renaming document:', error);
                    alert(`Fehler beim Umbenennen des Dokuments: ${error.message}`);
                });
        }
    }


    async function deleteFile(fileId) {
        if (confirm('Bist du sicher, dass du diese Datei löschen möchtest?')) {
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
        //console.log('Form submit event fired');  // Debugging: Bestätige, dass das Submit-Event gefeuert wird

        const folderName = document.getElementById('folderNameInput').value;
        const parentFolderId = document.getElementById('parentFolderSelect').value;

        //console.log('Folder Name Input Value:', folderName);  // Debugging: Überprüfe den eingegebenen Ordnernamen
        //console.log('Parent Folder Select Value:', parentFolderId);  // Debugging: Überprüfe den Wert des ausgewählten Elternordners

        fetch('/api/folders/create', {  // Überprüfe den Endpunkt (angepasst für POST-Route)
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ folderName, parentFolderId })
        })
        .then(response => {
            //console.log('Fetch response:', response);  // Debugging: Überprüfe die Response vom Server
            return response.json();
        })
        .then(data => {
            //console.log('Response Data:', data);  // Debugging: Überprüfe die Daten, die vom Server zurückgegeben werden
            if (data.folderId) {
                //alert('Folder created successfully');
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

// Ordner umbenennen
async function renameFolder(folderId, oldFolderName) {
    const newFolderName = prompt("Geben Sie einen neuen Ordnernamen ein:", oldFolderName);
    if (newFolderName) {
        try {
            const response = await fetch('/api/folders/renameFolder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folderId, newFolderName })
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                throw new Error(errorMessage.message);
            }
            // Erfolgreich umbenannt
            //alert('Ordner erfolgreich umbenannt');
            fetchAndRenderFolderTree();  // Ordnerstruktur nach dem Umbenennen aktualisieren
        } catch (error) {
            console.error('Fehler beim Umbenennen des Ordners:', error);
            alert('Fehler: ' + error.message);
        }
    }
}