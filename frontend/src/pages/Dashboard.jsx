/**
 * Diese Datei enthält die Dashboard-Komponente.
 * Sie stellt die Hauptseite des Dashboards dar, auf der Benutzer Ordner und Dateien verwalten können.
 *
 * @autor Farah. 
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

import { useEffect, useState, useMemo } from "react";
import { fetchAndRenderFolderTree } from "../utils/fetchFoldersTree";
import { useNavigate, useLocation } from "react-router-dom";
import { FaFolder, FaPlus } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import CreateFolderForm from "../features/dashboard/CreateFolder";
import FolderElement from "../features/dashboard/FolderElement";
import { customFetch } from "../utils/helpers";
import { FaThList } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import Breadcrumbs from "../components/ui/Breadcrumbs";
import File from "../components/File";
import { IoClose } from "react-icons/io5";
import prodconfig from "../production-config";

// this is the dashboard homepage
function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const navigate = useNavigate();
  const [editingFolderId, setEditingFolderId] = useState(null); // To track which folder is being edited
  const [newFolderName, setNewFolderName] = useState(""); // To store the new folder name
  const [results, setResults] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // boolean to track if a file  is current downloading
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDocToRename, setSelectedDocToRename] = useState({});
  const [currentlyPreviewedFile, setCurrentlyPreviewedFile] = useState(null);
  const [filePreviewContent, setFilePreviewContent] = useState("");

  //view list
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    folderId: null,
    x: 0,
    y: 0,
  });
  const [isFileExplorerView, setIsFileExplorerView] = useState(
    JSON.parse(localStorage.getItem("isFileExplorerView")) ?? true
  );

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const folderTree = await fetchAndRenderFolderTree();
        console.log("bb", folderTree);
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Ordnerstruktur:", error);
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);
  const handleCreateFolderSwal = async (id) => {
    const { value: folderName } = await Swal.fire({
      title: "Neuen Ordner erstellen",
      input: "text",
      inputLabel: "Ordnername",
      inputPlaceholder: "Gib den Namen des neuen Ordners ein",
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
      createFolder(folderName, id);
    }
  };

  const createFolder = async (folderName, id) => {
    setIsCreating(true);
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/folders/create`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderName, parentFolderId: id }),
        }
      );

      const data = await response.json();
      if (data.folderId) {
        Swal.fire("Erfolg", "Ordner erfolgreich erstellt", "Erfolg");
        window.location.reload();
      } else {
        Swal.fire(
          "Fehler",
          data?.message || "Fehler beim Erstellen des Ordners",
          "fehler"
        );
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Ordners:", error);
      Swal.fire(
        "Fehler",
        "Beim Erstellen des Ordners ist ein Fehler aufgetreten.",
        "fehler"
      );
    } finally {
      setIsCreating(false);
    }
  };
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
  const handleFileDelete = async (fileId) => {
    if (
      window.confirm("Bist du sicher, dass du diese Datei löschen möchtest?")
    ) {
      // setIsDeleting(true);

      try {
        const response = await customFetch(
          `${prodconfig.backendUrl}/docupload/delete/${fileId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!response.ok) throw new Error("Fehler beim Löschen der Datei");
        const data = await response.json();

        // setCurrentlyPreviewedFile(null);
        // setFilePreviewContent(null);

        const folderTree = await fetchAndRenderFolderTree();
        // if (folderTree) {
        //   setFolders(folderTree.folderTree);
        //   setLoading(false);
        // }
      } catch (error) {
        alert(
          "Fehler beim Löschen der Datei. Bitte versuche es später erneut."
        );
      } finally {
        // setIsDeleting(false);
      }
    }
  };
  // console.log(JSON.parse(localStorage.getItem("isFileExplorerView")));
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

  const toggleView = () => {
    setIsFileExplorerView((prev) => {
      const newValue = !prev;
      localStorage.setItem("isFileExplorerView", newValue);
      return newValue;
    });
  };

  // Function to handle right-click (context menu)
  const handleContextMenu = (event, folder) => {
    event.preventDefault(); // Prevent default right-click menu
    const rect = event.currentTarget.getBoundingClientRect(); // Get the folder's position
    setContextMenu({
      visible: true,
      folderId: folder.id,
      x: rect.right, // Position the menu outside the card on the right
      y: rect.top, // Align it vertically with the folder
    });
  };

  // Function to close the context menu
  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, folderId: null, x: 0, y: 0 });
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

  function useQuery() {
    const { search } = useLocation();

    return useMemo(() => new URLSearchParams(search), [search]);
  }

  let searchQuery = useQuery();
  const searchQueryParam = searchQuery.get("search");

  console.log("searchQuery", searchQuery.get("search"));

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const response = await customFetch(`${prodconfig.backendUrl}/search/`, {
          method: "POST",
          body: JSON.stringify({ query: searchQueryParam, limit: 10 }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setResults(data);
        console.log(data);
      } catch (error) {
        setError(
          "Beim Suchen ist ein Fehler aufgetreten. Bitte versuche es erneut."
        );
        console.error("Suchfehler:", error);
      }
    };

    if (searchQueryParam) {
      fetchSearchResults();
    }
  }, [searchQueryParam]);

  console.log("results", results);

  if (isLoading) return <div>Wird geladen...</div>;

  return (
    <div>
      {searchQueryParam ? (
        <div>
          <h3 className="text-xl px-4 pt-2 pb-4 text-black">Suchergebnisse</h3>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-black">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-4 text-black">Name</th>

                    <th className="text-left py-2 px-4">Relevanz</th>
                    <th className="text-left py-2 px-4">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.map((file, index) => (
                    <File
                      file={file}
                      results={results}
                      isDeleting={isDeleting}
                      isDownloading={isDownloading}
                      handleFilePreview={handleFilePreview}
                      handleFileDownload={handleFileDownload}
                      setSelectedDocToRename={setSelectedDocToRename}
                      handleFileDelete={handleFileDelete}
                      setResults={setResults}
                      searchQueryParam={searchQueryParam}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <h3 className="text-[1rem] text-black/50 flex items-center justify-center h-[70vh]">
              Suche läuft ...
            </h3>
          )}
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
        <>
          <div className="shadow-sm bg-white border-y border-slate-200 absolute left-0 top-0 right-0">
            <div className="flex items-center gap-2 bg-gray-10 py-2 px-3">
              <Breadcrumbs
                isFileExplorerView={isFileExplorerView}
                folders={folders}
                toggleView={toggleView}
              />
            </div>
          </div>
          <div className="mt-5"></div>
          {!isFileExplorerView && (
            <div className="flex items-center justify-between py-3">
              <h3 className="text-lg text-black">Alle Ordner</h3>
            </div>
          )}

          {!isFileExplorerView ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="min-w-[300px] bg-muted/40 rounded-lg p-4 space-y-2 h-[calc(100vh-14rem)] grid2-scroll-y">
                {/* Neuer Button zur Ordnererstellung */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => handleCreateFolderSwal(null)} // Erstellungsfunktion aufrufen
                      className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark transition"
                      title="Neuen Ordner erstellen"
                      disabled={isCreating}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center p-1.5 rounded-sm cursor-pointer hover:bg-black/10"
                      onClick={() => navigate(`/folders/${folder.id}`)}
                    >
                      <FaFolder
                        className="text-xl text-primary mr-4"
                        // onContextMenu={(e) => handleContextMenu(e, folder)} // Handle right-click
                        // folderId={folder.id}
                      />
                      <span className="text-sm text-gray-800">
                        {folder.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* <div className="border border-black/30 p-2 rounded-sm">ff</div>
              <div className="border border-black/30 p-2 rounded-sm">ff</div> */}
            </div>
          ) : (
            <ul className="grid grid-cols-1 pl-0 xsm:grid-cols-3 gap-4 md:fap-7 md:grid-cols-5">
              {folders.map((folder) => {
                return (
                  <FolderElement
                    key={folder.id}
                    folderId={folder.id}
                    folderName={folder.name}
                    handleFolderDelete={handleFolderDelete}
                  />
                );
              })}
              <li
                tabIndex={0}
                onClick={() => setCreateNewFolder((p) => !p)}
                className="bg-white border-lg p-4 flex flex-col gap-1 justify-center items-center rounded-lg hover:opacity-80 border border-transparent hover:border-primary focus:border-primary focus:outline-primary cursor-pointer duration-200 transition-opacity shadow-sm"
              >
                <FaPlus className="w-full text-primary text-5xl" />
                <span>Neuer Ordner</span>
              </li>
            </ul>
          )}
          {createNewFolder && <CreateFolderForm parentFolderId={""} />}
          {/* Folders Section ends */}
        </>
      )}
    </div>
  );
}

export default Dashboard;
