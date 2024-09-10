document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const responseDiv = document.getElementById('response');
    const folderSelect = document.getElementById('folderSelect');

    // Fetch folders and populate the select element
    fetch('/api/folders/tree')       // ---- fetch('/folders/tree')  ????
        .then(response => response.json())
        .then(folders => {
            populateFolderSelect(folders);
        })
        .catch(error => console.error('Error fetching folders:', error));

    function populateFolderSelect(folders) {
        folderSelect.innerHTML = ''; // Clear existing options

        // Helper function to build options recursively
        function buildOptions(folders, parentId = null, depth = 0) {
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

            fetch('/api/docupload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('File upload response:', data);
                responseDiv.textContent = data.message;
            })
            .catch(error => {
                console.error('Error:', error);
                responseDiv.textContent = 'An error occurred during upload.';
            });
        });
    }
  
    // Add any other dashboard functionality here
});