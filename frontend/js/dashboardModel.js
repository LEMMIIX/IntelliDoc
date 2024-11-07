document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const responseDiv = document.getElementById('response');
    const folderSelect = document.getElementById('folderSelect');

    const versionHistoryContainer = document.getElementById('versionHistoryContainer');
    const versionHistoryList = document.getElementById('versionHistoryList');

    // Function to fetch and display version history for a selected document
    function fetchVersionHistory(documentId) {
        fetch(`/api/documents/${documentId}/versions`)
            .then(response => response.json())
            .then(data => {
                // Clear the existing version list
                versionHistoryList.innerHTML = '';

                if (data && data.versions && data.versions.length > 0) {
                    // Display the version history container
                    versionHistoryContainer.style.display = 'block';

                    // Populate the list with version information
                    data.versions.forEach(version => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `
                            Version ${version.versionNumber} - ${new Date(version.createdAt).toLocaleString()}
                            <button onclick="downloadVersion('${version.fileId}')">Download</button>
                            <button onclick="viewVersion('${version.fileId}')">View</button>
                        `;
                        versionHistoryList.appendChild(listItem);
                    });
                } else {
                    versionHistoryList.innerHTML = '<li>No version history available.</li>';
                }
            })
            .catch(error => console.error('Error fetching version history:', error));
    }

    // Function to download a specific version
    window.downloadVersion = function (fileId) {
        window.location.href = `/api/documents/versions/${fileId}/download`;
    };

    // Function to view a specific version (assuming it opens in a new window or preview area)
    window.viewVersion = function (fileId) {
        window.open(`/api/documents/versions/${fileId}/view`, '_blank');
    };

    // Example: Fetch version history when a document is selected (adjust to your logic)
    // Assuming you have a function or event that triggers when a document is selected
    document.getElementById('fileList').addEventListener('click', function (event) {
        const documentId = event.target.dataset.documentId;
        if (documentId) {
            fetchVersionHistory(documentId);
        }
    });

    // Fetch folders and populate the select element
    fetch('/api/folders/tree')       // ---- fetch('/folders/tree')  ????
        .then(response => response.json())
        .then(data => {
            //console.log('Fetched data:', data); // Protokolliere die gesamte Antwort
            if (data && Array.isArray(data.folderTree)) {
                populateFolderSelect(data.folderTree);
            } else {
                console.error('Expected folderTree to be an array but received:', data.folderTree);
            }
        })
        .catch(error => console.error('Error fetching folders:', error));

    function populateFolderSelect(folders) {
        folderSelect.innerHTML = ''; // Clear existing options

        // Add "No Folder" option
        const noFolderOption = document.createElement('option');
        noFolderOption.value = '';
        noFolderOption.textContent = 'No Folder';
        folderSelect.appendChild(noFolderOption);

        // Helper function to build options recursively
        function buildOptions(folders, parentId = null, depth = 0) {
            if (!Array.isArray(folders)) {
                console.error('Expected folders to be an array but received:', folders);
                return;
            }

            folders.forEach(folder => {
                // Create option element for each folder
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = ' '.repeat(depth * 2) + folder.name; // Indent to show hierarchy
                folderSelect.appendChild(option);

                // Recursively add children folders
                if (folder.children && folder.children.length > 0) {
                    buildOptions(folder.children, folder.id, depth + 1);
                }
            });
        }

        buildOptions(folders);
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(uploadForm);
            const selectedFolder = folderSelect.value;

            // If no folder is selected, handle accordingly
            if (!selectedFolder) {
                formData.append('folderId', ''); // Optionally pass an empty folder ID or handle accordingly
            } else {
                formData.append('folderId', selectedFolder);
            }

            fetch('/api/docupload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                //console.log('File upload response:', data);
                responseDiv.textContent = data.message;
            })
            .catch(error => {
                console.error('Error:', error);
                responseDiv.textContent = 'An error occurred during upload.';
            });
        });
    }
});
