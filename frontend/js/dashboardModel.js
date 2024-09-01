document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const responseDiv = document.getElementById('response');
    const folderSelect = document.getElementById('folderSelect');

    // Fetch folders and populate the select element
    fetch('/folders')
        .then(response => response.json())
        .then(folders => {
            populateFolderSelect(folders);
        })
        .catch(error => console.error('Error fetching folders:', error));

    function populateFolderSelect(folders) {
        folderSelect.innerHTML = '<option value="">Root</option>';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.folder_id;
            option.textContent = folder.folder_name;
            folderSelect.appendChild(option);
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(uploadForm);

            fetch('/docupload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                responseDiv.textContent = data.message;
                /*
                if (data.fileId) {
                    // Optionally, you can update the file list or preview here
                }*/
            })
            .catch(error => {
                console.error('Error:', error);
                responseDiv.textContent = 'An error occurred during upload.';
            });
        });
    }

    // Add any other dashboard functionality here
});