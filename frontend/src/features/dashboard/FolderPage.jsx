/**
 * @file Folder.jsx - Hauptkomponente für das Datei- und Ordnermanagement
 * @author Farah
 * @description Zentrale Komponente zur Verwaltung und Anzeige der Datei- und 
 * Ordnerstruktur. Bietet umfangreiche Funktionen für das Dokumentenmanagement.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires react-icons/*
 * @requires sweetalert2
 * @requires axios
 * @requires ../../utils/*
 * @requires ../../components/ui/*
 */

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
import { FaHistory } from "react-icons/fa";
import ParamsPopoverLayout from "../../components/ui/popver";
import Swal from "sweetalert2";
import axios from "axios";
import { getPathID } from "../../utils/helpers";
import { MdOutlineEdit } from "react-icons/md";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import prodconfig from "../../production-config";

/**
 * @typedef {Object} FolderState
 * @property {boolean} loading - Ladezustand der Komponente
 * @property {Array} folders - Array der Ordnerstruktur
 * @property {string} keywords - Suchbegriffe für Filterung
 * @property {Array} selectedFolders - Ausgewählte Ordner für Navigation
 * @property {boolean} isDeleting - Status des Löschvorgangs
 * @property {boolean} isDownloading - Status des Downloads
 * @property {Object} contextMenu - Zustand des Kontextmenüs
 * @property {string|null} selectedFolderId - ID des ausgewählten Ordners
 * @property {string|null} selectedFileId - ID der ausgewählten Datei
 */

/**
 * @typedef {Object} FilePreviewState
 * @property {Object|null} currentlyPreviewedFile - Aktuell angezeigte Datei
 * @property {string} filePreviewContent - Inhalt der Vorschau
 * @property {Array} versionHistory - Versionsverlauf der Datei
 * @property {Object} popoverOpen - Zustand der Popover-Anzeigen
 */

/**
 * @component Folder
 * @description Hauptkomponente für die Dateiverwaltung mit Ordnerstruktur,
 * Dateivorschau, Upload-Funktionalität und Versionskontrolle
 * 
 * @returns {JSX.Element} Die gerenderte Folder-Komponente
 */
function Folder() {
  const { folderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState("");

  const [selectedFolders, setSelectedFolders] = useState([]); // Um die Historie der ausgewählten Ordner zu verfolgen

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
  const [versionHistory, setVersionHistory] = useState([]);
  const [sortedVersions, setSortedVersions] = useState([]);
  console.log("version", sortedVersions);
  const [popoverOpen, setPopoverOpen] = useState({});
  const [loadingg, setLoadingg] = useState(false); // You can use this to track loading state

  /**
 * @function handlePopoverToggle
 * @description Schaltet die Sichtbarkeit des Popovers für eine spezifische Datei um
 * 
 * @param {string|number} fileId - ID der Datei, für die das Popover angezeigt werden soll
 * @returns {void}
 */
  const handlePopoverToggle = (fileId) => {
    setPopoverOpen((prevState) => ({
      ...prevState,
      [fileId]: !prevState[fileId], // Toggle the popover for the specific file
    }));
  };

  const loadVersionHistory = async (fileId) => {
    setLoadingg(true);
    try {
      // Assuming fetchVersionHistory fetches the version history based on the fileId
      await fetchVersionHistory(fileId);
    } catch (error) {
      console.error("Fehler beim Laden des Versionsverlaufs", fehler);
    } finally {
      setLoadingg(false);
    }
  };

  useEffect(() => {
    // Load version history when a specific file's popover is opened
    Object.keys(popoverOpen).forEach((fileId) => {
      if (popoverOpen[fileId]) {
        loadVersionHistory(fileId);
      }
    });
  }, [popoverOpen]);

  /**
 * @function fetchVersionHistory
 * @async
 * @description Ruft den Versionsverlauf einer Datei vom Server ab
 * 
 * @param {string|number} fileId - ID der Datei
 * @throws {Error} Bei fehlgeschlagener Server-Anfrage
 * @returns {Promise<void>} Aktualisiert den versionHistory-State
 */
  const fetchVersionHistory = async (fileId) => {
    // fetch version history for a file
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/docupload/versions/${fileId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log("data", data);
      setVersionHistory(data.versions);
      console.log("version1", versionHistory);
    } catch (error) {
      console.error("Fehler beim Abrufen des Versionsverlaufs:", fehler);
    }
  };
  const handleFileSelect = (fileId) => {
    // handle file selection to fetch version history
    setSelectedFileId(fileId);
    fetchVersionHistory(fileId);
  };
  // Code Added | Start
  const [inputError, setInputError] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedDocToRename, setSelectedDocToRename] = useState({});

  const popupRef = useRef(null);
  const folderContent = loading ? {} : getFolderContent(folders, folderId);
  const folderPathArray = folderContent?.folderPath?.split("/");
  console.log("folderContent", folderContent);
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
        console.error("Fehler beim Abrufen der Ordnerstruktur:", fehler);

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

  /**
 * @function handleRenameFolderInput
 * @description Validiert die Eingabe beim Umbenennen und setzt entsprechende Fehlermeldungen
 * 
 * @param {Event} e - Change-Event des Input-Feldes
 * @returns {void}
 */
  const handleRenameFolderInput = (e) => {
    let newFileName = e.target.value;
    setNewFolderName(newFileName);
    switch (newFileName) {
      case selectedDocToRename.name:
        setInputError("Bitte gib einen neuen Dateinamen an!");
        break;
      case "":
        setInputError("Kein Dateiname angegeben!");
        break;
      default:
        setInputError("");
        break;
    }
  };

  
  const handleRenameFolder = async () => {
    console.log("Klicke, um zu speichern!");
    if (inputError != "") {
      return;
    }
    setLoading(true);
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/folders/rename`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: selectedDocToRename.id,
            newFilename: newFolderName,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Fehler beim Umbenennen des Dokuments");
      }
      setIsPopupVisible(false);
      setLoading(false);
      setNewFolderName("");
      //alert("Dokumentname erfolgreich geändert!");
    } catch (e) {
      console.log("error: ", e);
      setLoading(false);
      setIsPopupVisible(false);
      setNewFolderName("");
      alert("Fehler beim Umbenennen des Dokuments");
    }
  };

  const [editingFolderId, setEditingFolderId] = useState(null); // To track which folder is being edited
  // const [newFolderName, setNewFolderName] = useState("");

  const [isFileExplorerView, setIsFileExplorerView] = useState(true);
  const [cont, setCont] = useState(1);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  /**
 * @function handleFolderSelect
 * @description Verarbeitet die Auswahl eines Ordners und aktualisiert die Navigation
 * 
 * @param {Object} folder - Der ausgewählte Ordner
 * @param {number} level - Die Ebene in der Ordnerhierarchie
 * @returns {void}
 */
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

  /**
 * @function handleFileClick
 * @description Verarbeitet Klicks auf Dateien und zeigt Vorschau an
 * 
 * @param {Object} file - Die angeklickte Datei
 * @returns {void}
 */
  const handleFileClick = (file) => {
    setSelectedFileId(file.id); // Die ID der ausgewählten Datei aktualisieren
    handleFilePreview(file.id); // Datei in der Vorschau anzeigen
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [uploadRef]);

  /**
 * @function handleFolderDelete
 * @async
 * @description Verarbeitet das Löschen eines Ordners mit Bestätigung
 * 
 * @param {string|number} folderId - ID des zu löschenden Ordners
 * @throws {Error} Bei fehlgeschlagener Server-Anfrage
 * @returns {Promise<void>}
 */
  const handleFolderDelete = async (folderId) => {
    if (confirm("Bist du sicher, dass du diesen Ordner löschen möchtest?")) {
      setIsDeleting(true);
      try {
        const response = await customFetch(
          `${prodconfig.backendUrl}/folders/${folderId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Fehler beim Löschen des Ordners");
        }
        const data = await response.json();

        // Fetch and update the folder tree
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }

        // Success message
        await Swal.fire(
          "Gelöscht!",
          "Der Ordner wurde erfolgreich gelöscht.",
          "success"
        );
      } catch (error) {
        console.error("Fehler beim Löschen des Ordners:", error);

        // Error message
        await Swal.fire(
          "Fehler",
          "Fehler beim Löschen des Ordners. Bitte versuche es erneut.",
          "error"
        );
      }
    }
  };

  if (loading) {
    return <div>Wird geladen...</div>;
  }

    /**
 * Navigiert zurück zur vorherigen Seite.
 * 
 * @function handleGoBack
 */
  const handleGoBack = () => {
    navigate(-1); // Zurück zur vorherigen Seite
  };

  /**
 * Navigiert zu einem bestimmten Ordner in der Breadcrumb-Navigation.
 * 
 * @function handlePathClick
 * @param {number} index - Der Index des Ordners im Pfad.
 */
  const handlePathClick = (index) => {
    // Get the folder path up to the clicked index
    const newPath = folderContent?.folderPath.split("/");
    navigate(-(newPath.length - index - 1)); // Zurück zur vorherigen Seite
    // Here, you would typically also update the folderId based on the newPath or fetch the content for that path
    console.log(newPath.length, index); // For demonstration, logging the new path
    // You can update your state or call a function to fetch the new folder content based on newPath
  };

  /**
 * Zeigt eine Vorschau für verschiedene Dateiformate an.
 * 
 * @async
 * @function handleFilePreview
 * @param {string} fileName - Der Name der Datei, die angezeigt werden soll.
 * @throws {Error} Falls die Datei nicht geladen werden kann.
 */
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
            src={`${prodconfig.backendUrl}/docupload/view/${encodeURIComponent(
              fileName
            )}`}
            alt="Image Preview"
            className="max-w-full mx-auto object-contain w-[500px] h-[300px]"
          />
        );
      } else if (["pdf"].includes(fileExtension)) {
        // PDF-Vorschau
        setFilePreviewContent(
          <iframe
            src={`${prodconfig.backendUrl}/docupload/view/${encodeURIComponent(
              fileName
            )}`}
            frameBorder="0"
            width="100%"
            height="600px"
          />
        );
      } else if (fileExtension === "txt") {
        // Textdatei-Vorschau
        const response = await customFetch(
          `${prodconfig.backendUrl}/docupload/view/${encodeURIComponent(
            fileName
          )}`,
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
          `${prodconfig.backendUrl}/docupload/view/${encodeURIComponent(
            fileName
          )}`,
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
      console.error("Fehler beim Laden der Datei:", error);
    }
  };

  /**
 * Lädt eine Datei vom Server herunter.
 * 
 * @async
 * @function handleFileDownload
 * @param {string} fileName - Der Name der Datei, die heruntergeladen werden soll.
 * @throws {Error} Falls ein Fehler beim Download auftritt.
 */
  const handleFileDownload = async (fileName) => {
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/docupload/download/${encodeURIComponent(
          fileName
        )}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Fehler beim Herunterladen der Datei");
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
      console.error("Download-Fehler:", error);
    }
  };

  /**
 * Löscht eine Datei nach Bestätigung durch den Benutzer.
 * 
 * @async
 * @function handleFileDelete
 * @param {string} fileId - Die ID der zu löschenden Datei.
 * @throws {Error} Falls die Datei nicht gelöscht werden kann.
 */

  const handleFileDelete = async (fileId) => {
    if (
      window.confirm("Bist du sicher, dass du diese Datei löschen möchtest?")
    ) {
      setIsDeleting(true);

      try {
        const response = await customFetch(
          `${prodconfig.backendUrl}/docupload/delete/${fileId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!response.ok) throw new Error("Fehler beim Löschen der Datei");
        const data = await response.json();

        setCurrentlyPreviewedFile(null);
        setFilePreviewContent(null);

        // Fetch and update the folder tree
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }

        // Success message
        await Swal.fire(
          "Gelöscht!",
          "Die Datei wurde erfolgreich gelöscht.",
          "success"
        );
      } catch (error) {
        console.error("Fehler beim Löschen der datei:", error);

        // Error message
        await Swal.fire(
          "Fehler",
          "Fehler beim Löschen der datei . Bitte versuche es erneut.",
          "error"
        );
      }
    }
  };

  /**
 * Navigiert zu einem angeklickten Unterordner.
 * 
 * @function handleFolderClick
 * @param {Object} folder - Das angeklickte Ordner-Objekt.
 * @param {number} levelIndex - Der Index des Ordners in der Hierarchie.
 */

  const handleFolderClick = (folder, levelIndex) => {
    const newStack = folderStack.slice(0, levelIndex + 1); // Keep only the levels up to the clicked level
    newStack.push(folder.children); // Add the clicked folder's subfolders
    setFolderStack(newStack); // Update the stack to re-render
  };

  /**
 * Setzt den aktuell ausgewählten Ordner.
 * 
 * @function handleFolderClickbg
 * @param {Object} folder - Der ausgewählte Ordner.
 */
  const handleFolderClickbg = (folder) => {
    // Fügt den ausgewählten Ordner zum Verlauf hinzu

    setSelectedFolderIdBg(folder.id); // Aktualisiert die ID des ausgewählten Ordners
  };

  /**
 * Entfernt den letzten Eintrag aus dem Ordnerverlauf.
 * 
 * @function handleGoBackClick
 */
  const handleGoBackClick = () => {
    // Den letzten Ordner aus dem Verlauf entfernen
    setSelectedFolders(selectedFolders.slice(0, -1));
  };
  console.log("prev", filePreviewContent);

  /**
 * Öffnet das Kontextmenü für einen Ordner.
 * 
 * @function handleContextMenu
 * @param {Event} event - Das Kontextmenü-Event.
 * @param {Object} folder - Das Ordner-Objekt für das Kontextmenü.
 */
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

  /**
 * Schließt das Kontextmenü.
 * 
 * @function handleCloseContextMenu
 */
  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, folderId: null, x: 0, y: 0 });
  };

  /**
 * Sendet eine Anfrage zum Umbenennen eines Ordners.
 * 
 * @async
 * @function handleRenameSubmit
 * @param {string} folderId - Die ID des umzubenennenden Ordners.
 * @param {string} newFolderName - Der neue Name des Ordners.
 * @throws {Error} Falls ein Fehler beim Umbenennen auftritt.
 */
  const handleRenameSubmit = async (folderId, newFolderName) => {
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/folders/rename`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: folderId,
            newFilename: newFolderName,
          }),
        }
      );

      alert(response.data.message);
      setEditingFolderId(null); // Close the input after renaming
      setNewFolderName(""); // Clear the input field
      window.location.reload(); // Reload to reflect the changes
    } catch (error) {
      console.error("Fehler beim Umbenennen des Ordners:", error);
      alert("Fehler beim Umbenennen des Ordners.");
    }
  };

  /**
 * Öffnet eine SweetAlert-Eingabe zum Erstellen eines neuen Ordners.
 * 
 * @async
 * @function handleCreateFolderSwal
 */
  const handleCreateFolderSwal = async () => {
    const { value: folderName } = await Swal.fire({
      title: "Neuen Ordner erstellen",
      input: "text",
      inputLabel: "Ordnername",
      inputPlaceholder: "Gib den Namen des Ordners ein",
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

 /**
 * Erstellt einen neuen Ordner mit dem angegebenen Namen.
 * 
 * @async
 * @function createFolder
 * @param {string} folderName - Der Name des neuen Ordners.
 * @throws {Error} Falls das Erstellen des Ordners fehlschlägt.
 */
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
          "Fehler",
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

  /**
 * Öffnet eine SweetAlert-Eingabe zum Hochladen einer Datei.
 * 
 * @async
 * @function handleFileUploadSwal
 * @param {string} id - Die ID des Zielordners für den Upload.
 */
  const handleFileUploadSwal = async (id) => {
    const { value: formValues } = await Swal.fire({
      title: "Datei hochladen",
      html: '<input type="file" id="fileInput" class="swal2-input" accept="*/*">',
      showCancelButton: true,
      confirmButtonText: "Hochladen",
      cancelButtonText: "Abbrechen",
      focusConfirm: false,
      preConfirm: () => {
        const selectedFile = document.getElementById("fileInput").files[0];
        const folderId = id;

        if (!selectedFile || !folderId) {
          Swal.showValidationMessage(
            "Wähle eine Datei aus und gib eine Ordner-ID ein."
          );
          return;
        }

        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("folderId", folderId);

        // `customFetch`-Aufruf für Datei-Upload
        return customFetch(`${prodconfig.backendUrl}/docupload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      },
    });

    if (formValues) {
      Swal.fire("Erfolg", "Datei erfolgreich hochgeladen!", "erfolg").then(
        () => {
          window.location.reload();
        }
      );
    }
  };
  console.log(contextMenu);

  return (
    <>
      <div className="pg-black">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-black"></h3>
        </div>
        <div className="shadow-sm bg-white border-y border-slate-200 absolute left-0 top-0 right-0">
          <div className="flex items-center gap-2 bg-gray-10 py-2 px-3">
            <Breadcrumbs
              path={folderContent?.folderPath || ""}
              isFileExplorerView={isFileExplorerView}
              folderPathArray={folderPathArray || []}
              folders={folders}
              toggleView={toggleView}
            />
          </div>
        </div>
        {isFileExplorerView ? (
          <div className="mt-10">
            <div>
              {/* Folders Section starts */}
              <h3 className="mb-4 flex items-center gap-1 tracking-wide text-lg text-black">
                Alle Ordner
              </h3>
              <ul className="grid grid-cols-1 pl-0 xsm:grid-cols-3 gap-4 md:gap-7 md:grid-cols-5">
                {(folderContent?.children || []).map((folder) => (
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
                  <span>Neuer Ordner</span>
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

              {folderContent?.files?.length || 0 > 0 ? (
                <div className="">
                  <table className="w-full text-black">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-4 text-black">Name</th>
                        <th className="text-left py-2 px-4">Aktionen</th>
                        {/* <th className="text-left py-2 px-4">Keywords</th> */}
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
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={() => handlePopoverToggle(file.id)} // Toggle popover visibility for the specific file
                                  style={{
                                    padding: "10px",
                                    borderRadius: "5px",
                                    // background: "#007BFF",
                                    color: "black",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  <FaHistory /> {/* Historie-Icon */}
                                </button>
                                {popoverOpen[file.id] && ( // Check if the popover for the specific file is open
                                  <ParamsPopoverLayout
                                    open={popoverOpen[file.id]}
                                    setOpen={() => handlePopoverToggle(file.id)}
                                    top={"100%"}
                                    left={"-23rem"}
                                  >
                                    <div
                                      style={{
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                        padding: "10px",
                                        background: "white",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        boxShadow:
                                          "0 4px 6px rgba(0, 0, 0, 0.1)",
                                        zIndex: 999,
                                      }}
                                    >
                                      <div className="flex justify-between mx-8">
                                        <p className="font-weight-800 text-lg">
                                          Versionen
                                        </p>
                                        <p className="text-base">geändert</p>
                                      </div>
                                      {loading ? (
                                        <p>Loading...</p>
                                      ) : versionHistory?.length > 0 ? (
                                        <ul
                                          style={{
                                            padding: "0",
                                            margin: "10px 0",
                                            listStyle: "none",
                                          }}
                                        >
                                          {versionHistory?.map((version) => (
                                            <li
                                              className="flex justify-between mx-8"
                                              key={version.file_id}
                                              style={{
                                                padding: "5px 0",
                                                borderBottom: "1px solid #eee",
                                              }}
                                            >
                                              <div className="flex items-center ">
                                                <p>
                                                  <IoIosDocument
                                                    className={`text-lg ${
                                                      file.name
                                                        .split(".")
                                                        .pop() === "pdf" &&
                                                      "text-danger"
                                                    } ${
                                                      [
                                                        "word",
                                                        "docx",
                                                        "odt",
                                                        "txt",
                                                      ].includes(
                                                        file.name
                                                          .split(".")
                                                          .pop()
                                                      ) && "text-blue-600"
                                                    }`}
                                                  />
                                                </p>
                                                <span className="pr-2">
                                                  {file.name}
                                                </span>{" "}
                                                -
                                                <p className="pl-2">
                                                  {" "}
                                                  version {version.version}
                                                </p>
                                              </div>
                                              <p>
                                                {new Date(
                                                  version.created_at
                                                ).toLocaleString()}
                                              </p>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p>Kein Versionsverlauf verfügbar.</p>
                                      )}
                                    </div>
                                  </ParamsPopoverLayout>
                                )}
                              </div>
                              <button
                                onClick={async () => {
                                  // Extrahiere die Dateierweiterung und den Dateinamen ohne Erweiterung
                                  const fileExtension = file.name
                                    .split(".")
                                    .pop(); // Extrahiert die Dateierweiterung
                                  const fileNameWithoutExtension =
                                    file.name.replace(`.${fileExtension}`, ""); // Entfernt die Erweiterung aus dem Namen

                                  const { value: newName } = await Swal.fire({
                                    title: "Datei umbenennen",
                                    input: "text",
                                    inputLabel: "Neuer Dateiname",
                                    inputValue: fileNameWithoutExtension, // Zeigt nur den Namen ohne Erweiterung an
                                    showCancelButton: true,
                                    confirmButtonText: "Speichern",
                                    inputValidator: (value) => {
                                      if (!value)
                                        return "Du musst einen Dateinamen eingeben!";
                                    },
                                  });
                                  if (newName) {
                                    // Füge die ursprüngliche Dateierweiterung wieder hinzu
                                    const fullFilename = `${newName}.${fileExtension}`;
                                    try {
                                      const response = await customFetch(
                                        `${prodconfig.backendUrl}/folders/rename`,
                                        {
                                          method: "POST",
                                          credentials: "include",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            documentId: file.id,
                                            newFilename: fullFilename, // Sende den neuen Namen mit der ursprünglichen Erweiterung
                                          }),
                                        }
                                      );
                                      if (!response.ok)
                                        throw new Error(
                                          "Fehler beim Umbenennen der Datei"
                                        );

                                      await Swal.fire(
                                        "Erfolg!",
                                        "Datei erfolgreich umbenannt",
                                        "erfolg"
                                      );
                                      window.location.reload();
                                    } catch (error) {
                                      await Swal.fire(
                                        "Fehler!",
                                        "Datei konnte nicht umbenannt werden",
                                        "fehler"
                                      );

                                      console.error(
                                        "Fehler beim Umbenennen der Datei:",
                                        error
                                      );
                                    }
                                  }
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
          <div className="mt-3 relative">
            <div className="grid2-scroll-x pb-4">
              <div
                className="flex gap-2 p-4 min-w-max "
                style={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* First column - root folders */}
                <div className="min-w-[300px] bg-muted/40 rounded-lg p-4 space-y-2 h-[calc(100vh-14rem)] grid2-scroll-y">
                  {folders.map((folder) => (
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <div
                          key={folder.id}
                          className={`flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                            selectedFolderIds[0] === folder.id
                              ? "bg-accent"
                              : ""
                          }`}
                          onClick={() => {
                            handleFolderSelect(folder, 0);
                            setSelectedFolderIds([folder.id]);
                          }}
                        >
                          <FaFolder className="w-5 h-5 text-blue-500" />
                          <span className="text-sm">{folder.name}</span>
                          {folder.children?.length > 0 && (
                            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={async () => {
                            const { value: folderName } = await Swal.fire({
                              title: "Neuen Ordner erstellen",
                              input: "text",
                              inputLabel: "Ordnername",
                              inputPlaceholder: "Ordnernamen eingeben",
                              showCancelButton: true,
                              confirmButtonText: "Erstellen",
                              inputValidator: (value) => {
                                if (!value)
                                  return "Du musst einen Ordnernamen eingeben!";
                              },
                            });

                            if (folderName) {
                              try {
                                const response = await customFetch(
                                  `${prodconfig.backendUrl}/folders/create`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      folderName,
                                      parentFolderId: folder.id,
                                    }),
                                  }
                                );
                                if (!response.ok)
                                  throw new Error(
                                    "Fehler beim Erstellen des Ordners"
                                  );

                                await Swal.fire(
                                  "Erfolg!",
                                  "Ordner erfolgreich erstellt",
                                  "erfolg"
                                );
                                window.location.reload();
                              } catch (error) {
                                await Swal.fire(
                                  "Fehler!",
                                  "Ordner konnte nicht erstellt werden",
                                  "fehler"
                                );

                                console.error(
                                  "Fehler beim Erstellen des Ordners:",
                                  error
                                );
                              }
                            }
                          }}
                        >
                          Neuer Ordner
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={async () => {
                            const { value: file } = await Swal.fire({
                              title: "Datei auswählen",
                              input: "file",
                              inputAttributes: {
                                accept: "*/*",
                                "aria-label": "Datei hochladen",
                              },
                            });

                            if (file) {
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                formData.append("folderId", folder.id);

                                const response = await customFetch(
                                  `${prodconfig.backendUrl}/docupload`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                    body: formData,
                                  }
                                );
                                if (!response.ok)
                                  throw new Error(
                                    "Fehler beim Hochladen der Datei"
                                  );

                                await Swal.fire(
                                  "Erfolg!",
                                  "Datei erfolgreich hochgeladen",
                                  "erfolg"
                                );
                                window.location.reload();
                              } catch (error) {
                                await Swal.fire(
                                  "Fehler!",
                                  "Datei konnte nicht hochgeladen werden",
                                  "fehler"
                                );
                                console.error(
                                  "Fehler beim Hochladen der Datei:",
                                  error
                                );
                              }
                            }
                          }}
                        >
                          Neues Dokument
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Bist du sicher?",
                              text: "Dies kann nicht rückgängig gemacht werden!",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#3085d6",
                              cancelButtonColor: "#d33",
                              confirmButtonText: "Ja, lösche es!",
                            });

                            if (result.isConfirmed) {
                              try {
                                const response = await customFetch(
                                  `${prodconfig.backendUrl}/folders/${folder.id}`,
                                  {
                                    method: "DELETE",
                                    credentials: "include",
                                  }
                                );
                                if (!response.ok)
                                  throw new Error(
                                    "Fehler beim Löschen des Ordners"
                                  );

                                Swal.fire(
                                  "Gelöscht!",
                                  "Ordner wurde gelöscht.",
                                  "success"
                                );
                                window.location.reload();
                              } catch (error) {
                                Swal.fire(
                                  "Fehler!",
                                  "Ordner konnte nicht gelöscht werden",
                                  "error"
                                );
                                console.error(
                                  "Fehler beim Löschen des Ordners:",
                                  error
                                );
                              }
                            }
                          }}
                        >
                          Löschen
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={async () => {
                            const { value: folderName } = await Swal.fire({
                              title: "Neuen Ordner erstellen",
                              input: "text",
                              inputLabel: "Ordnername",
                              inputValue: folder.name,
                              inputPlaceholder: "Ordnernamen eingeben",
                              showCancelButton: true,
                              confirmButtonText: "Erstellen",
                              inputValidator: (value) => {
                                if (!value)
                                  return "Du musst einen Ordnernamen eingeben!";
                              },
                            });

                            if (folderName) {
                              try {
                                const response = await customFetch(
                                  `${prodconfig.backendUrl}/folders/renameFolder`,
                                  {
                                    method: "POST",
                                    credentials: "include",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      folderId: folder.id,
                                      newFolderName: folderName,
                                    }),
                                  }
                                );
                                if (!response.ok)
                                  throw new Error(
                                    "Fehler beim Umbenennen des Ordners"
                                  );

                                await Swal.fire(
                                  "Erfolg!",
                                  "Ordnername erfolgreich geändert!",
                                  "success"
                                );
                                window.location.reload();
                              } catch (error) {
                                await Swal.fire(
                                  "Fehler!",
                                  "Beim Umbenennen des Ordners ist etwas schiefgelaufen.",
                                  "error"
                                );
                                console.error(
                                  "Fehler beim Erstellen des Ordners:",
                                  error
                                );
                              }
                            }
                          }}
                        >
                          Umbenennen
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>

                {/* Additional columns for selected folder hierarchy */}
                {[...Array(cont)]
                  .slice(Math.max(0, cont - 2))
                  .map((_, level) => {
                    // const actualLevel =
                    //   cont <= 2 ? level + 1 : cont - 2 + level;
                    const actualLevel =
                      cont <= 2 ? level + 1 : cont - 1 + level;

                    return (
                      <div
                        key={actualLevel}
                        className="min-w-[300px] bg-muted/40 rounded-lg p-4 space-y-2 h-[calc(100vh-14rem)] grid2-scroll-y"
                      >
                        {selectedFolders[actualLevel - 1] &&
                          getChildren(selectedFolders[actualLevel - 1]).map(
                            (subFolder) => (
                              <ContextMenu key={subFolder.id}>
                                <ContextMenuTrigger>
                                  <div
                                    className={`flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                                      selectedFolderIds[actualLevel] ===
                                      subFolder.id
                                        ? "bg-accent"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      console.log("Clicked folder:", subFolder);
                                      handleFolderSelect(
                                        subFolder,
                                        actualLevel
                                      );
                                      setSelectedFolderIds((prev) => {
                                        const newIds = [...prev];
                                        newIds[actualLevel] = subFolder.id;
                                        return newIds;
                                      });
                                    }}
                                  >
                                    <FaFolder className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm">
                                      {subFolder.name}
                                    </span>
                                    {subFolder.children?.length > 0 && (
                                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-48">
                                  <ContextMenuItem
                                    onClick={async () => {
                                      const { value: folderName } =
                                        await Swal.fire({
                                          title: "Neuen Ordner erstellen",
                                          input: "text",
                                          inputLabel: "Ordnername",
                                          inputPlaceholder:
                                            "Ordnernamen eingeben",
                                          showCancelButton: true,
                                          confirmButtonText: "Erstellen",
                                          inputValidator: (value) => {
                                            if (!value)
                                              return " Du musst einen Ordnernamen eingeben!";
                                          },
                                        });

                                      if (folderName) {
                                        try {
                                          const response = await customFetch(
                                            `${prodconfig.backendUrl}/folders/create`,
                                            {
                                              method: "POST",
                                              credentials: "include",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                folderName,
                                                parentFolderId: subFolder.id,
                                              }),
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Fehler beim Erstellen des Ordners"
                                            );

                                          await Swal.fire(
                                            "Erfolg!",
                                            "Ordner erfolgreich erstellt",
                                            "success"
                                          );
                                          window.location.reload();
                                        } catch (error) {
                                          await Swal.fire(
                                            "Fehler!",
                                            "Ordner konnte nicht erstellt werden",
                                            "error"
                                          );
                                          console.error(
                                            "Fehler beim Erstellen des Ordners:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    Neuer Ordner
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={async () => {
                                      const { value: folderName } =
                                        await Swal.fire({
                                          title: "Neuen Ordner erstellen",
                                          input: "text",
                                          inputLabel: "Ordnername",
                                          inputValue: subFolder.name,
                                          inputPlaceholder:
                                            "Ordnernamen eingeben",
                                          showCancelButton: true,
                                          confirmButtonText: "Erstellen",
                                          inputValidator: (value) => {
                                            if (!value)
                                              return "Du musst einen Ordnernamen eingeben!";
                                          },
                                        });

                                      if (folderName) {
                                        try {
                                          const response = await customFetch(
                                            `${prodconfig.backendUrl}/folders/renameFolder`,
                                            {
                                              method: "POST",
                                              credentials: "include",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                folderId: subFolder.id,
                                                newFolderName: folderName,
                                              }),
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Fehler beim Umbenennen des Ordners"
                                            );

                                          await Swal.fire(
                                            "Erfolg!",
                                            "Ordnername erfolgreich geändert!",
                                            "success"
                                          );
                                          window.location.reload();
                                        } catch (error) {
                                          await Swal.fire(
                                            "Fehler!",
                                            "Beim Umbenennen des Ordners ist etwas schiefgelaufen.",
                                            "error"
                                          );
                                          console.error(
                                            "Fehler beim Erstellen des Ordners:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    Umbenennen
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={async () => {
                                      const { value: file } = await Swal.fire({
                                        title: "Datei auswählen",
                                        input: "file",
                                        inputAttributes: {
                                          accept: "*/*",
                                          "aria-label": "Lade deine Datei hoch",
                                        },
                                      });

                                      if (file) {
                                        try {
                                          const formData = new FormData();
                                          formData.append("file", file);
                                          formData.append(
                                            "folderId",
                                            subFolder.id
                                          );

                                          const response = await customFetch(
                                            `${prodconfig.backendUrl}/docupload`,
                                            {
                                              method: "POST",
                                              credentials: "include",
                                              body: formData,
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Failed to upload file"
                                            );

                                          await Swal.fire(
                                            "Erfolg!",
                                            "Datei erfolgreich hochgeladen",
                                            "success"
                                          );
                                          window.location.reload();
                                        } catch (error) {
                                          await Swal.fire(
                                            "Fehler!",
                                            "Datei konnte nicht hochgeladen werden",
                                            "error"
                                          );
                                          console.error(
                                            "Fehler beim Hochladen der Datei:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    Neues Dokument
                                  </ContextMenuItem>

                                  <ContextMenuItem
                                    onClick={async () => {
                                      try {
                                        const response = await customFetch(
                                          `${prodconfig.backendUrl}/folders/${subFolder.id}`,
                                          {
                                            method: "DELETE",
                                            credentials: "include",
                                          }
                                        );
                                        if (!response.ok)
                                          throw new Error(
                                            "Fehler beim Löschen des Ordners"
                                          );
                                        window.location.reload();
                                      } catch (error) {
                                        console.error(
                                          "Fehler beim Löschen des Ordners:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    Löschen
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            )
                          )}
                        {selectedFolders[actualLevel - 1] &&
                          getFiles(selectedFolders[actualLevel - 1]).map(
                            (file) => (
                              <ContextMenu key={file.id}>
                                <ContextMenuTrigger>
                                  <div
                                    className={`flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                                      selectedFileId === file.id
                                        ? "bg-accent"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      console.log("Clicked file:", file);
                                      handleFilePreview(file.name);
                                      setSelectedFileId(file.name);
                                    }}
                                  >
                                    <IoIosDocument
                                      className={`w-5 h-5 ${
                                        file.name
                                          .toLowerCase()
                                          .endsWith(".docx") ||
                                        file.name.toLowerCase().endsWith(".doc")
                                          ? "text-blue-500"
                                          : "text-red-500"
                                      }`}
                                    />
                                    <span className="text-sm">{file.name}</span>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-48">
                                  <ContextMenuItem
                                    onClick={async () => {
                                      try {
                                        const response = await customFetch(
                                          `${prodconfig.backendUrl}/docupload/view/${file.name}`,
                                          {
                                            credentials: "include",
                                          }
                                        );
                                        if (!response.ok)
                                          throw new Error(
                                            "Fehler beim Anzeigen der Datei"
                                          );
                                        const content = await response.text();
                                        setFilePreviewContent(content);
                                        setCurrentlyPreviewedFile(file.name);
                                      } catch (error) {
                                        await Swal.fire(
                                          "Fehler!",
                                          "Fehler beim Anzeigen der Datei",
                                          "error"
                                        );
                                        console.error(
                                          "Fehler beim Anzeigen der Datei:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    Anzeigen
                                  </ContextMenuItem>

                                  <ContextMenuItem
                                    onClick={async () => {
                                      try {
                                        const response = await customFetch(
                                          `${prodconfig.backendUrl}/docupload/download/${file.name}`,
                                          {
                                            credentials: "include",
                                          }
                                        );
                                        if (!response.ok)
                                          throw new Error(
                                            "Fehler beim Herunterladen der Datei"
                                          );
                                        const blob = await response.blob();
                                        const url =
                                          window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = file.name;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        a.remove();
                                        await Swal.fire(
                                          "Erfolg!",
                                          "Datei erfolgreich heruntergeladen",
                                          "success"
                                        );
                                      } catch (error) {
                                        await Swal.fire(
                                          "Fehler!",
                                          "Fehler beim Herunterladen der Datei",
                                          "error"
                                        );
                                        console.error(
                                          "Fehler beim Herunterladen der Datei:",
                                          error
                                        );
                                      }
                                    }}
                                  >
                                    Herunterladen
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={async () => {
                                      const { value: newName } =
                                        await Swal.fire({
                                          title: "Datei umbenennen",
                                          input: "text",
                                          inputLabel: "Neuer Dateiname",
                                          inputValue: file.name,
                                          showCancelButton: true,
                                          inputValidator: (value) => {
                                            if (!value)
                                              return "Du musst einen Dateinamen eingeben!";
                                          },
                                        });

                                      if (newName) {
                                        try {
                                          const response = await customFetch(
                                            `${prodconfig.backendUrl}/folders/rename`,
                                            {
                                              method: "POST",
                                              credentials: "include",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                documentId: file.id,
                                                newFilename: newName,
                                              }),
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Fehler beim Umbenennen der Datei"
                                            );

                                          await Swal.fire(
                                            "Erfolg!",
                                            "Datei erfolgreich umbenannt",
                                            "success"
                                          );
                                          window.location.reload();
                                        } catch (error) {
                                          await Swal.fire(
                                            "Fehler!",
                                            "Datei konnte nicht umbenannt werden",
                                            "error"
                                          );
                                          console.error(
                                            "Fehler beim Umbenennen der Datei:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    Umbenennen
                                  </ContextMenuItem>

                                  <ContextMenuItem
                                    onClick={async () => {
                                      const result = await Swal.fire({
                                        title: "Bist du sicher?",
                                        text: "Dies kann nicht rückgängig gemacht werden!",
                                        icon: "warning",
                                        showCancelButton: true,
                                        confirmButtonColor: "#3085d6",
                                        cancelButtonColor: "#d33",
                                        confirmButtonText: "Ja, lösche es!",
                                      });

                                      if (result.isConfirmed) {
                                        try {
                                          const response = await customFetch(
                                            `${prodconfig.backendUrl}/docupload/delete/${file.id}`,
                                            {
                                              method: "DELETE",
                                              credentials: "include",
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Fehler beim Löschen der Datei"
                                            );

                                          await Swal.fire(
                                            "Gelöscht!",
                                            "Datei wurde gelöscht.",
                                            "success"
                                          );
                                          window.location.reload();
                                        } catch (error) {
                                          await Swal.fire(
                                            "Fehler!",
                                            "Datei konnte nicht gelöscht werden",
                                            "error"
                                          );
                                          console.error(
                                            "Fehler beim Löschen der Datei:",
                                            error
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    Löschen
                                  </ContextMenuItem>
                                  <div key={file.id}>
                                    <ContextMenuItem
                                      onClick={() =>
                                        handlePopoverToggle(file.id)
                                      }
                                    >
                                      version
                                    </ContextMenuItem>
                                  </div>
                                </ContextMenuContent>
                              </ContextMenu>
                            )
                          )}
                        {folderContent.files.map((file, index) => (
                          <>
                            {popoverOpen[file.id] && ( // Check if the popover for the specific file is open
                              <ParamsPopoverLayout
                                open={popoverOpen[file.id]}
                                setOpen={() => handlePopoverToggle(file.id)}
                                top={"32%"}
                                left={"51rem"}
                              >
                                <div
                                  style={{
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    padding: "10px",
                                    background: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    zIndex: 999,
                                  }}
                                >
                                  <div className="flex justify-between mx-8">
                                    <p className="font-weight-800 text-lg">
                                      Versionen
                                    </p>
                                    <p className="text-base">geändert</p>
                                  </div>
                                  {loading ? (
                                    <p>Loading...</p>
                                  ) : versionHistory?.length > 0 ? (
                                    <ul
                                      style={{
                                        padding: "0",
                                        margin: "10px 0",
                                        listStyle: "none",
                                      }}
                                    >
                                      {versionHistory?.map((version) => (
                                        <li
                                          className="flex justify-between mx-8"
                                          key={version.file_id}
                                          style={{
                                            padding: "5px 0",
                                            borderBottom: "1px solid #eee",
                                          }}
                                        >
                                          <div className="flex items-center ">
                                            <p>
                                              <IoIosDocument
                                                className={`text-lg ${
                                                  file.name.split(".").pop() ===
                                                    "pdf" && "text-danger"
                                                } ${
                                                  [
                                                    "word",
                                                    "docx",
                                                    "odt",
                                                    "txt",
                                                  ].includes(
                                                    file.name.split(".").pop()
                                                  ) && "text-blue-600"
                                                }`}
                                              />
                                            </p>
                                            <span className="pr-2">
                                              {file.name}
                                            </span>{" "}
                                            -
                                            <p className="pl-2">
                                              {" "}
                                              version {version.version}
                                            </p>
                                          </div>
                                          <p>
                                            {new Date(
                                              version.created_at
                                            ).toLocaleString()}
                                          </p>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>Kein Versionsverlauf verfügbar.</p>
                                  )}
                                </div>
                              </ParamsPopoverLayout>
                            )}
                          </>
                        ))}
                      </div>
                    );
                  })}

                {/* File Preview Column */}
                {currentlyPreviewedFile && (
                  <div className="min-w-[300px] bg-muted/40 rounded-lg p-6 transition-all duration-300 ease-in-out relative h-[calc(100vh-14rem)] grid2-scroll-y">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCurrentlyPreviewedFile(null);
                        setFilePreviewContent(null);
                        setSelectedFileId(null);
                      }}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                    <h3 className="font-bold mb-4 text-xl">
                      {currentlyPreviewedFile}
                    </h3>
                    <div className="text-lg">{filePreviewContent}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
              Umbenennen
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
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="bg-white rounded-md px-6 shadow-lg max-w-md w-full"
            ref={popupRef} // Reference to detect clicks outside
          >
            <h2 className="text-lg font-normal py-4 text-left">
              Umbenennen von „{selectedDocToRename?.name?.substring(0, 10)}“ in:
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
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Folder;
