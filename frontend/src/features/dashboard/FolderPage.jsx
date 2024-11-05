/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAndRenderFolderTree } from "../../utils/fetchFoldersTree";
import { FaFile, FaFolder, FaMinus, FaPlus } from "react-icons/fa6";
import { AiOutlineDelete } from "react-icons/ai";
import { HiOutlineViewfinderCircle } from "react-icons/hi2";
import { GoDownload } from "react-icons/go";
import { IoIosDocument } from "react-icons/io";
import { MdImage } from "react-icons/md";
import { customFetch, getFolderContent } from "../../utils/helpers";
import { IoClose } from "react-icons/io5";
import CreateFolderForm from "./CreateFolder";
import FolderElement from "./FolderElement";
import FileUpload from "./FileUpload";
import { FaThList } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { getPathID } from "../../utils/helpers";
import { MdOutlineEdit } from "react-icons/md";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
const backendUrl = "http://localhost:3000";

function Folder() {
  const { folderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();

  const [selectedFolders, setSelectedFolders] = useState([]); // Um die Historie der ausgewählten Ordner zu verfolgen
  /////
  const [isDeleting, setIsDeleting] = useState(false);
  // boolean to track if a file  is current downloading
  const [isDownloading, setIsDownloading] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    folderId: null,
    x: 0,
    y: 0,
  });
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderIdBg, setSelectedFolderIdBg] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null); // Status für die ausgewählte Datei

  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [currentlyPreviewedFile, setCurrentlyPreviewedFile] = useState(null); // Track current previewed file
  const [filePreviewContent, setFilePreviewContent] = useState(""); // File preview content

  // Code Added | Start
  const [inputError, setInputError] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedDocToRename, setSelectedDocToRename] = useState({});

  const popupRef = useRef(null);
  // Code Added | End

  const folderContent = loading ? {} : getFolderContent(folders, folderId);
  const folderPathArray = folderContent?.folderPath?.split("/");
  console.log("folderContent", folderContent);
  // const currentFolder = selectedFolders[selectedFolders.length - 1] || folderContent; // Dossier actuel
  const [render, setRender] = useState();

  const [folderStack, setFolderStack] = useState([folderContent?.children]); // rootFolders is the top-level folder data
  console.log(folderContent);
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching folder tree:", error);
        setLoading(false);
      }
    };

    fetchFolders();
  }, [folderId, isPopupVisible]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupVisible(false);
        setInputError(""); // Clear error when popup closes
      }
    };

    if (isPopupVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupVisible]);

  const handleRenameFolderInput = (e) => {
    let newFileName = e.target.value;
    setNewFolderName(newFileName);

    switch (newFileName) {
      case selectedDocToRename.name:
        setInputError("Please provide a new file name!");
        break;
      case "":
        setInputError("No file name provided!");
        break;
      default:
        setInputError("");
        break;
    }
  };

  const handleRenameFolder = async () => {
    console.log("click to save!");
    if (inputError != "") {
      return;
    }

    setLoading(true);
    try {
      const response = await customFetch(`${backendUrl}/folders/rename`, {
        method: "POST",
        body: JSON.stringify({
          documentId: selectedDocToRename.id,
          newFilename: newFolderName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to rename folder");
      }
      setIsPopupVisible(false);
      setLoading(false);
      setNewFolderName("");
      alert("Folder Name Changed Success!");
    } catch (e) {
      console.log("error: ", e);
      setLoading(false);
      setIsPopupVisible(false);
      setNewFolderName("");
      alert("Failed to rename document");
    }
  };

  const [editingFolderId, setEditingFolderId] = useState(null); // To track which folder is being edited
  // const [newFolderName, setNewFolderName] = useState("");

  const [isFileExplorerView, setIsFileExplorerView] = useState(false);

  // const [selectedFolders, setSelectedFolders] = useState([]);
  // const [selectedFolders, setSelectedFolders] = useState([folderContent]);
  const [cont, setCont] = useState(1);
  // const [selectedFolders, setSelectedFolders] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  const handleFolderSelect = (folder, level) => {
    const newSelectedFolders = [...selectedFolders];
    newSelectedFolders[level] = folder; // Update the selected folder at this level
    setCont(level + 1); // Increase the level counter

    // Reset lower levels
    for (let i = level + 1; i < newSelectedFolders.length; i++) {
      newSelectedFolders[i] = undefined;
    }

    navigate(`/folders/${folder.id}`);
    setSelectedFolders(newSelectedFolders);

    // Update selected folder IDs
    const newSelectedFolderIds = [...selectedFolderIds];
    newSelectedFolderIds[level] = folder.id; // Store the selected folder ID for this level
    setSelectedFolderIds(newSelectedFolderIds);
  };

  const getChildren = (folder) => {
    return folder?.children || [];
  };

  const getFiles = (folder) => {
    return folder?.files || [];
  };
  // Rekursive Funktion zum Anzeigen der Ordner
  const renderFolders = (folder, level) => {
    return (
      <div key={folder.id} className="relative border-l pl-4">
        <div
          className="flex items-center p-2 cursor-pointer"
          onClick={() => handleFolderSelect(folder, level)}
        >
          <FaFolder className="text-xl text-primary mr-2" />
          <span className="text-sm text-gray-800">{folder.name}</span>
        </div>
        {selectedFolders[level] === folder && (
          <div className="ml-4">
            {getChildren(folder).map((subFolder) =>
              renderFolders(subFolder, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleFileClick = (file) => {
    setSelectedFileId(file.id); // Die ID der ausgewählten Datei aktualisieren
    handleFilePreview(file.name); // Datei in der Vorschau anzeigen
  };
  useEffect(() => {
    const storedValue = localStorage.getItem("isFileExplorerView");
    if (storedValue !== null) {
      setIsFileExplorerView(JSON.parse(storedValue)); // Wert abrufen und analysieren
    }
  }, []);

  const toggleView = () => {
    setIsFileExplorerView((prev) => {
      const newValue = !prev;
      localStorage.setItem("isFileExplorerView", newValue);
      return newValue;
    });
  };

  useEffect(() => {
    setCurrentlyPreviewedFile(null);
    setFilePreviewContent(null);
  }, [folderId]);

  const uploadRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadRef.current && !uploadRef.current.contains(event.target)) {
        setShowUploadFile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Entfernen Sie das Ereignis beim Demontieren
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [uploadRef]);

  const handleFolderDelete = async (folderId) => {
    if (confirm("Are you sure you want to delete this folder?")) {
      setIsDeleting(true);
      try {
        const response = await customFetch(
          `${backendUrl}/folders/${folderId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete folder");
        }
        const data = await response.json();

        // Updates the folder structure
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  const handleFDelete = async (fileId) => {
    if (confirm("Are you sure you want to delete this folder?")) {
      setIsDeleting(true);
      try {
        const response = await customFetch(
          `${backendUrl}/folders/${folderId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete folder");
        }
        const data = await response.json();

        // Updates the folder structure
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  const handleGoBack = () => {
    navigate(-1); // Zurück zur vorherigen Seite
  };

  const handlePathClick = (index) => {
    // Get the folder path up to the clicked index
    const newPath = folderContent?.folderPath.split("/");
    navigate(-(newPath.length - index - 1)); // Zurück zur vorherigen Seite

    // Here, you would typically also update the folderId based on the newPath or fetch the content for that path
    console.log(newPath.length, index); // For demonstration, logging the new path
    // You can update your state or call a function to fetch the new folder content based on newPath
  };

  const handleFilePreview = async (fileName) => {
    // Überprüfen, ob die Vorschau gerade die Datei anzeigt, auf die geklickt wurde
    if (currentlyPreviewedFile === fileName) {
      // Vorschau ausblenden, wenn dieselbe Datei erneut geklickt wird
      setCurrentlyPreviewedFile(null);
      setFilePreviewContent(null);
      return;
    }

    // Neue Datei wird angeklickt, also Vorschau aktualisieren
    setCurrentlyPreviewedFile(fileName);

    try {
      const fileExtension = fileName.split(".").pop().toLowerCase();

      if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
        // Bildvorschau
        setFilePreviewContent(
          <img
            src={`${backendUrl}/docupload/view/${encodeURIComponent(fileName)}`}
            alt="Image Preview"
            className="max-w-full mx-auto object-contain w-[500px] h-[300px]"
          />
        );
      } else if (["pdf"].includes(fileExtension)) {
        // PDF-Vorschau
        setFilePreviewContent(
          <iframe
            src={`${backendUrl}/docupload/view/${encodeURIComponent(fileName)}`}
            frameBorder="0"
            width="100%"
            height="600px"
          />
        );
      } else if (fileExtension === "txt") {
        // Textdatei-Vorschau
        const response = await customFetch(
          `${backendUrl}/docupload/view/${encodeURIComponent(fileName)}`,
          {
            credentials: "include",
          }
        );
        const textContent = await response.text();
        console.log(textContent);
        setFilePreviewContent(
          <div
            dangerouslySetInnerHTML={{ __html: textContent }}
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              border: "1px solid #ddd",
            }}
          />
        );
      } else if (fileExtension === "docx") {
        // DOCX-Vorschau
        const response = await customFetch(
          `${backendUrl}/docupload/view/${encodeURIComponent(fileName)}`,
          {
            credentials: "include",
          }
        );
        const docxContent = await response.text(); // Der Server liefert HTML zurück
        setFilePreviewContent(
          <div
            dangerouslySetInnerHTML={{ __html: docxContent }}
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              border: "1px solid #ddd",
            }}
          />
        );
      } else {
        // Other file types
        setFilePreviewContent(<p>File: {fileName}</p>);
      }
    } catch (error) {
      console.error("Error loading file:", error);
    }
  };

  const handleFileDownload = async (fileName) => {
    try {
      const response = await customFetch(
        `${backendUrl}/docupload/download/${encodeURIComponent(fileName)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob(); // Retrieve file as blob
      const url = window.URL.createObjectURL(blob); // Create a URL for the blob

      // Create a temporary anchor element for downloading
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName; // Specify the file name for download
      document.body.appendChild(a);
      a.click(); // Programmatically click the anchor to trigger download
      window.URL.revokeObjectURL(url); // Clean up the URL object
      a.remove(); // Remove the temporary anchor element from the DOM
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      setIsDeleting(true);

      try {
        const response = await customFetch(
          backendUrl + `/docupload/delete/${fileId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to delete file");
        const data = await response.json();

        setCurrentlyPreviewedFile(null);
        setFilePreviewContent(null);

        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
      } catch (error) {
        alert("Failed to delete file. Please try again later.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleFolderClick = (folder, levelIndex) => {
    const newStack = folderStack.slice(0, levelIndex + 1); // Keep only the levels up to the clicked level
    newStack.push(folder.children); // Add the clicked folder's subfolders
    setFolderStack(newStack); // Update the stack to re-render
  };
  const handleFolderClickbg = (folder) => {
    // Fügt den ausgewählten Ordner zum Verlauf hinzu

    setSelectedFolderIdBg(folder.id); // Aktualisiert die ID des ausgewählten Ordners
  };
  const handleGoBackClick = () => {
    // Den letzten Ordner aus dem Verlauf entfernen
    setSelectedFolders(selectedFolders.slice(0, -1));
  };
  console.log("prev", filePreviewContent);

  const handleContextMenu = (event, folder) => {
    event.preventDefault(); // Prevent default right-click menu
    const rect = event.currentTarget.getBoundingClientRect(); // Get the folder's position
    setContextMenu({
      visible: true,
      folderId: folder.id,
      name: folder.name,
      x: rect.right + 10, // Position the menu outside the card on the right
      y: rect.top, // Align it vertically with the folder
    });
  };

  // Function to close the context menu
  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, folderId: null, x: 0, y: 0 });
  };

  const handleRenameSubmit = async (folderId, newFolderName) => {
    try {
      const response = await customFetch(`${backendUrl}/folders/rename`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: folderId,
          newFilename: newFolderName,
        }),
      });

      alert(response.data.message);
      setEditingFolderId(null); // Close the input after renaming
      setNewFolderName(""); // Clear the input field
      window.location.reload(); // Reload to reflect the changes
    } catch (error) {
      console.error("Error renaming folder:", error);
      alert("Failed to rename folder.");
    }
  };

  // const handleEditClick = (folderId, currentFolderName) => {
  //   Swal.fire({
  //     title: "Edit Folder Name",
  //     input: "text",
  //     inputLabel: "New Folder Name",
  //     inputValue: currentFolderName, // Set the current folder name as the default value
  //     showCancelButton: true,
  //     confirmButtonText: "Save",
  //     cancelButtonText: "Cancel",
  //     inputValidator: (value) => {
  //       if (!value) {
  //         return "Please enter a new folder name";
  //       }
  //     },
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       const newFolderName = result.value;
  //       handleRenameSubmit(folderId, newFolderName); // Pass folderId and new name for renaming
  //     }
  //   });
  // };
  // Funktion zur Anzeige des Formulars zum Erstellen eines Ordners mit SweetAlert
  const handleCreateFolderSwal = async () => {
    const { value: folderName } = await Swal.fire({
      title: "Neuen Ordner erstellen",
      input: "text",
      inputLabel: "Ordnername",
      inputPlaceholder: "Geben Sie den Namen des Ordners ein",
      showCancelButton: true,
      confirmButtonText: "Erstellen",
      cancelButtonText: "Abbrechen",
      inputValidator: (value) => {
        if (!value) {
          return "Der Ordnername ist erforderlich!";
        }
      },
    });

    if (folderName) {
      createFolder(folderName); // Ruft die Funktion auf, um den Ordner mit dem eingegebenen Namen zu erstellen
    }
  };

  // Funktion zum Erstellen eines Ordners
  const createFolder = async (folderName) => {
    setIsCreating(true);
    try {
      const response = await customFetch(backendUrl + "/folders/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName,
          parentFolderId: contextMenu.folderId,
        }),
      });
      const folderTree = await fetchAndRenderFolderTree();
      if (folderTree) {
        setFolders(folderTree.folderTree);
        setLoading(false);
      }
      navigate(`/folders/${contextMenu.folderId}`);
      const data = await response.json();
      if (data.folderId) {
        Swal.fire("Erfolgreich", "Ordner erfolgreich erstellt", "erfolgreich");
      } else {
        Swal.fire(
          "Erreur",
          data?.message ||
            "Beim Erstellen des Ordners ist ein Fehler aufgetreten.",
          "fehler"
        );
      }
    } catch (error) {
      console.error(
        "Beim Erstellen des Ordners ist ein Fehler aufgetreten:",
        error
      );
      Swal.fire(
        "Fehler",
        "Beim Erstellen des Ordners ist ein Fehler aufgetreten.",
        "Fehler"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUploadSwal = async (id) => {
    const { value: formValues } = await Swal.fire({
      title: "Upload File",
      html: '<input type="file" id="fileInput" class="swal2-input" accept="*/*">',
      showCancelButton: true,
      confirmButtonText: "Upload",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const selectedFile = document.getElementById("fileInput").files[0];
        const folderId = id;

        if (!selectedFile || !folderId) {
          Swal.showValidationMessage(
            "Please select a file and enter a folder ID."
          );
          return;
        }

        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("folderId", folderId);

        // `customFetch`-Aufruf für Datei-Upload
        return customFetch(`${backendUrl}/docupload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      },
    });

    if (formValues) {
      Swal.fire("Success", "File uploaded successfully!", "success").then(
        () => {
          window.location.reload();
        }
      );
    }
  };
  console.log(contextMenu);
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-black"></h3>
        </div>
        <div className="shadow-sm bg-white border-y border-slate-200 absolute left-0 top-0 right-0">
          <div className="flex items-center gap-2 bg-gray-10 py-2 px-3">
            <Breadcrumbs
              path={folderContent.folderPath}
              isFileExplorerView={isFileExplorerView}
              folderPathArray={folderPathArray}
              folders={folders}
              toggleView={toggleView}
            />
          </div>
        </div>
        {isFileExplorerView ? (
          <div className="mt-10">
            {/* header start */}
            {/* header start */}
            {/* header start */}
            {/* <div className="shadow-sm bg-white border-y border-slate-200 absolute left-0 top-0 right-0 px-4 py-2">
              <h5 className="flex items-center gap-3 tracking-wide"> */}
            {/* <button
                  onClick={() => {
                    navigate("/dashboard");
                  }}
                >
                  <svg
                    className="cursor-pointer"
                    width="15"
                    height="15"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.5522 14.3554V8.81896C15.5522 7.91739 15.1826 7.05528 14.5299 6.43432L9.2928 1.45227C8.65893 0.849243 7.66431 0.849243 7.03045 1.45227L1.79337 6.43432C1.14059 7.05528 0.770996 7.91739 0.770996 8.81896V14.3554C0.770996 15.2637 1.50631 16 2.41336 16H13.9099C14.817 16 15.5522 15.2637 15.5522 14.3554Z"
                      stroke="#9B9B9B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button> */}
            {/* Back button */}
            {/* <button
                  onClick={handleGoBack}
                  //lassName="flex items-center mr-3"
                  //style={{ marginRight: "0px" }}
                >
                  <svg
                    onClick={() => {
                      navigate(`/folders/${folderId}`); // Hier wird zur Dashboard-Seite navigiert
                    }}
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <path
                      d="M8 1L3 7.5L8 14"
                      stroke="#9B9B9B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button> */}
            {/* Folder Path */}

            {/* {folderContent.folderPath.split("/").map((segment, index) => (
                  <span key={index} className="text-[#9B9B9B] cursor-pointer">
                    
                    <div
                      className="relative inline-block cursor-pointer"
                      onClick={() => handlePathClick(index)}
                    >
                      <span className="text-blue-500">{segment}</span>
                      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500" />
                    </div>

                    {index < folderContent.folderPath.split("/").length - 1 &&
                      " / "}
                  </span>
                ))} */}
            {/* </h5> */}

            {/* </div> */}

            {/* header end */}
            <div>
              {/* Folders Section starts */}
              <h3 className="mb-4 flex items-center gap-1 tracking-wide text-lg text-black">
                All Folders
              </h3>
              <ul className="grid grid-cols-1 pl-0 xsm:grid-cols-3 gap-4 md:gap-7 md:grid-cols-5">
                {folderContent.children?.map((folder) => (
                  <FolderElement
                    key={folder.id}
                    folderId={folder.id}
                    folderName={folder.name}
                    handleFolderDelete={handleFolderDelete}
                  />
                ))}

                <li
                  tabIndex={0}
                  onClick={() => setCreateNewFolder((p) => !p)}
                  className="bg-white border-lg p-4 flex flex-col gap-1 justify-center items-center rounded-lg hover:opacity-80 border border-transparent hover:border-primary focus:border-primary focus:outline-primary cursor-pointer duration-200 transition-opacity shadow-sm "
                >
                  <FaPlus className="w-full text-primary text-5xl" />
                  <span>New Folder</span>
                </li>
              </ul>
              {createNewFolder && (
                <CreateFolderForm parentFolderId={folderId} />
              )}
              {/* Folders Section ends */}
            </div>
            <div>
              {/* Files Section starts */}
              <div>
                {/* Files Section starts */}
                <div className="flex justify-between items-center">
                  <h3 className="my-5 flex items-center gap-1 tracking-wide text-lg text-black">
                    Dokumente
                  </h3>
                  <button
                    className="bg-success p-2 rounded-full flex justify-center items-center cursor-pointer hover:bg-opacity-90 duration-200 transition-opacity"
                    onClick={() => setShowUploadFile((p) => !p)}
                  >
                    {showUploadFile ? (
                      <FaMinus className="text-white" />
                    ) : (
                      <FaPlus className="text-white" />
                    )}
                  </button>
                </div>
                {/* Fügen Sie hier das Ref-Attribut hinzu. */}
                {showUploadFile && (
                  <div ref={uploadRef}>
                    <FileUpload folderId={folderId} />
                  </div>
                )}
              </div>

              {folderContent.files.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-black">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-4 text-black">Name</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {folderContent.files.map((file, index) => (
                        <tr
                          key={file.id}
                          className="border-b last:border-b-0 border-slate-200"
                        >
                          <td
                            className="py-2 px-4 flex items-center gap-1"
                            onClick={() => handleFilePreview(file.name)}
                          >
                            {["png", "jpg", "jpeg", "gif"].includes(
                              file.name.split(".").pop()
                            ) ? (
                              <MdImage className="text-success text-lg" />
                            ) : (
                              <IoIosDocument
                                className={`text-lg ${
                                  file.name.split(".").pop() === "pdf" &&
                                  "text-danger"
                                } ${
                                  ["word", "docx", "odt", "txt"].includes(
                                    file.name.split(".").pop()
                                  ) && "text-blue-600"
                                }`}
                              />
                            )}
                            <span>{file.name}</span>
                          </td>
                          <td>
                            <div className="flex gap-3 items-center">
                              <button
                                disabled={isDeleting}
                                className="hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
                                onClick={() => handleFilePreview(file.name)}
                              >
                                <HiOutlineViewfinderCircle className="text-lg" />
                              </button>
                              <button
                                disabled={isDeleting}
                                onClick={() => handleFileDownload(file.name)}
                                className="text-primary hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
                              >
                                <GoDownload className="text-lg" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDocToRename(file);
                                  setIsPopupVisible(true);
                                }}
                                className="hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
                              >
                                <MdOutlineEdit className="text-lg" />
                              </button>
                              <button
                                disabled={isDeleting || isDownloading}
                                onClick={() => handleFileDelete(file.id)}
                                className="text-danger hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
                              >
                                <AiOutlineDelete className="text-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-lg text-black my-4">
                  Dieser Ordner enthält noch keine Dokumente. :(
                </p>
              )}
              {/* Files Section ends */}
            </div>
            {currentlyPreviewedFile && (
              <div className="my-4 bg-white p-4 rounded-xl shadow-md">
                <button
                  className="ml-auto flex text-lg border-[1.5px] border-danger bg-danger text-white hover:bg-opacity-90 duration-200 transition-colors p-2 rounded-full mb-2"
                  onClick={() => {
                    setCurrentlyPreviewedFile(null);
                    setFilePreviewContent(null);
                  }}
                >
                  <IoClose />
                </button>
                {filePreviewContent}
              </div>
            )}
          </div>
        ) : (
          <div
            className="mt-3 flex space-x-2 overflow-x-auto"
            // style={{ marginLeft: "-85px", width: "150%" }}
          >
            {/* Header */}

            <div className="flex space-x-2">
              {/* Karte für die Liste der Ordner der Ebene 0*/}
              <div className="relative w-[350px] h-[750px] border rounded-lg shadow-sm p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2">Ordner (Ebene 0)</h3>
                {folders.map((folder) => renderFolders(folder, 0))}
              </div>

              {/* Karten für die unteren Ebenen hinzufügen */}
              {[...Array(cont)].slice(Math.max(0, cont - 3)).map((_, level) => {
                const actualLevel = cont <= 3 ? level : cont - 3 + level; // Calculate the actual level
                return (
                  <div
                    key={actualLevel}
                    className="relative w-[300px] h-[750px] border rounded-lg shadow-sm p-4"
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Unterordner und Dokumente des ausgewählten Ordners (Ebene{" "}
                      {actualLevel + 1})
                    </h3>
                    {selectedFolders[actualLevel] &&
                    (getChildren(selectedFolders[actualLevel]).length > 0 ||
                      getFiles(selectedFolders[actualLevel]).length > 0) ? (
                      <>
                        {getChildren(selectedFolders[actualLevel]).map(
                          (subFolder) => (
                            <div
                              key={subFolder.id}
                              className={`flex items-center p-1 cursor-pointer ${
                                selectedFolderIds[actualLevel] === subFolder.id
                                  ? "bg-blue-100"
                                  : ""
                              }`} // Change background for selected folder
                              onContextMenu={(e) =>
                                handleContextMenu(e, subFolder)
                              }
                              onClick={() => {
                                handleFolderSelect(subFolder, actualLevel + 1);
                                setSelectedFolderIds((prev) => {
                                  const newIds = [...prev];
                                  newIds[actualLevel] = subFolder.id; // Update selected folder ID for this level
                                  return newIds;
                                });
                              }}
                            >
                              <FaFolder className="text-xl text-primary mr-2" />
                              <span className="text-sm text-gray-800">
                                {subFolder.name}
                              </span>
                            </div>
                          )
                        )}
                        {getFiles(selectedFolders[actualLevel]).map((file) => (
                          <div
                            key={file.id}
                            onClick={() => {
                              handleFilePreview(file.name);
                              setSelectedFileId(file.id); // Update the selected file ID
                            }}
                            onContextMenu={(e) => handleContextMenu(e, file)}
                            className={`flex items-center p-2 cursor-pointer ${
                              selectedFileId === file.id ? "bg-blue-100" : ""
                            }`} // Change background for selected file
                          >
                            {["png", "jpg", "jpeg", "gif"].includes(
                              file.name.split(".").pop()
                            ) ? (
                              <MdImage className="text-success text-lg mr-2" />
                            ) : (
                              <IoIosDocument
                                className={`text-lg ${
                                  file.name.split(".").pop() === "pdf"
                                    ? "text-danger"
                                    : ""
                                } ${
                                  ["word", "odt", "txt", "docx"].includes(
                                    file.name.split(".").pop()
                                  )
                                    ? "text-blue-600"
                                    : ""
                                } mr-2`}
                              />
                            )}
                            <span className="text-sm text-gray-800">
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-gray-500">
                        Keine Unterordner und Dokumente zum Anzeigen.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {currentlyPreviewedFile && (
              <div className="relative w-[300px] h-auto border rounded-lg shadow-sm p-4 overflow-y-auto">
                <button
                  className="ml-auto flex text-lg border-[1.5px] border-danger bg-danger text-white hover:bg-opacity-90 duration-200 transition-colors p-2 rounded-full mb-2"
                  onClick={() => {
                    setCurrentlyPreviewedFile(null);
                    setFilePreviewContent(null);
                    setSelectedFileId(null);
                  }}
                >
                  <IoClose />
                </button>

                {/* Vorschauinhalt */}
                <div className="flex flex-col items-center space-y-4">
                  {/* Container für den Dateiinhalte (in Form eines Quadrats) */}
                  <div className="w-[350px] h-[250px] flex items-center justify-center overflow-hidden bg-gray-100">
                    {filePreviewContent ? (
                      <div className="w-full h-full p-2 flex items-center justify-center">
                        {filePreviewContent}{" "}
                        {/* Anzeige des Dateiinhalts in einem Quadrat. */}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Kein Inhalt zum Anzeigen für diese Datei.
                      </p>
                    )}
                  </div>

                  {/* Dateiname unten */}
                  <span className="text-sm text-gray-800">
                    {filePreviewContent.props.src.split("/").pop()}{" "}
                  </span>
                </div>
              </div>
            )}

            {/* Dynamically generate cards based on folder selection */}

            {/* Context Menu */}
            {contextMenu.visible && (
              <div
                className="absolute bg-white border rounded shadow-lg p-2 z-10"
                style={{
                  top: `${contextMenu.y - 40}px`,
                  left: `${contextMenu.x - 400}px`,
                }}
              >
                {/* Neuen Ordner erstellen */}
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleCreateFolderSwal}
                >
                  Neuen Ordner erstellen
                </button>

                {/* Datei hochladen */}
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleFileUploadSwal(contextMenu.folderId)}
                >
                  Datei hochladen
                </button>

                {/* Bestehender Button für "Bearbeiten" */}
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() =>
                    handleEditClick(contextMenu.folderId, contextMenu.name)
                  }
                >
                  Rename
                </button>

                {/* Bestehender Button für "Löschen" */}
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleFolderDelete(contextMenu.folderId)}
                >
                  Löschen
                </button>
              </div>
            )}

            {/* Close context menu when clicking outside */}
            {contextMenu.visible && (
              <div
                className="fixed inset-0 z-0"
                onClick={handleCloseContextMenu}
              ></div>
            )}
          </div>
        )}
        {contextMenu.visible && (
          <div
            className="fixed inset-0 z-0"
            onClick={handleCloseContextMenu}
          ></div>
        )}
      </div>
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="bg-white rounded-md px-6 shadow-lg max-w-md w-full"
            ref={popupRef} // Reference to detect clicks outside
          >
            <h2 className="text-lg font-normal py-4 text-left">
              Rename "{selectedDocToRename?.name?.substring(0, 10)}" to:
            </h2>
            <div>
              <input
                type="text"
                value={newFolderName}
                onChange={handleRenameFolderInput}
                className={`rounded-md placeholder:text-md border-[1.5px] border-transparent ${
                  inputError &&
                  "border-red-500 placeholder:text-red-500 focus:border-red-500"
                } bg-black/10 p-3 text-black/70 focus:border-primary focus-visible:outline-none w-full`}
                placeholder="New Document name"
                autoFocus
              />
              {inputError && (
                <span className="text-red-500 text-sm">{inputError}</span>
              )}
            </div>
            <div className="flex justify-end mt-6 pb-6">
              <button
                onClick={() => {
                  handleRenameFolder();
                }}
                // className={`bg-[#436BF5] text-white px-4 py-2 rounded-md hover:bg-[#426AF3] transition duration-200 ease-in-out mr-2 ${
                //   (setLoading || inputError) &&
                //   "cursor-not-allowed bg-opacity-50 hover:bg-opacity-50"
                // }`}
                // disabled={setLoading || inputError}
                className="bg-[#436BF5] text-white px-4 py-2 rounded-md hover:bg-[#426AF3] transition duration-200 ease-in-out"
              >
                {/* {setLoading ? "Loading..." : "Save"} */}
                Speichern
              </button>
              <button
                onClick={() => {
                  setSelectedDocToRename({});
                  setIsPopupVisible(false);
                  setInputError("");
                }}
                className="bg-gray-300 px-4 py-2 rounded-sm hover:bg-gray-400 transition duration-200 ease-in-out"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Folder;
