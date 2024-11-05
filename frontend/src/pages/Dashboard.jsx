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

const backendUrl = "http://localhost:3000";
// this is the dashboard homepage
function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const navigate = useNavigate();
  const [editingFolderId, setEditingFolderId] = useState(null); // To track which folder is being edited
  const [newFolderName, setNewFolderName] = useState(""); // To store the new folder name
  const [results, setResults] = useState([]);

  //view list
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    folderId: null,
    x: 0,
    y: 0,
  });
  const [isFileExplorerView, setIsFileExplorerView] = useState(
    !JSON.parse(localStorage.getItem("isFileExplorerView"))
      ? !JSON.parse(localStorage.getItem("isFileExplorerView"))
      : false
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
        console.error("Error fetching folder tree:", error);
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  // console.log(JSON.parse(localStorage.getItem("isFileExplorerView")));
  const handleFolderDelete = async (folderId) => {
    if (confirm("Are you sure you want to delete this folder?")) {
      try {
        const response = await customFetch(
          backendUrl + `/folders/${folderId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete folder");
        }
        const data = await response.json();
        // setSuccess(data.message);
        const folderTree = await fetchAndRenderFolderTree();
        if (folderTree) {
          setFolders(folderTree.folderTree);
          setLoading(false);
        }
        // Updates the folder structure
      } catch (error) {
        console.error("Error deleting folder:", error);
        // setError("Failed to delete folder. Please try again later.");
      }
    }
  };

  const toggleView = () => {
    setIsFileExplorerView((prev) => {
      const newValue = !prev;
      localStorage.setItem("isFileExplorerView", !newValue);
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

  // const handleFolderDelete = async (folderId) => {
  //   if (confirm("Are you sure you want to delete this folder?")) {
  //     setIsDeleting(true);
  //     try {
  //       const response = await customFetch(
  //         backendUrl + `/folders/${folderId}`,
  //         {
  //           method: "DELETE",
  //           credentials: "include",
  //         }
  //       );
  //       if (!response.ok) {
  //         throw new Error("Failed to delete folder");
  //       }
  //       const data = await response.json();

  //       // Updates the folder structure
  //       const folderTree = await fetchAndRenderFolderTree();
  //       if (folderTree) {
  //         setFolders(folderTree);
  //         setLoading(false);
  //       }
  //     } catch (error) {
  //       console.error("Error deleting folder:", error);
  //     } finally {
  //       setIsDeleting(false);
  //     }
  //   }
  // };
  // console.log(contextMenu.folderId);
  const handleRenameSubmit = async (folderId, newFolderName) => {
    try {
      const response = await customFetch(
        "http://localhost:3000/folders/rename",
        {
          method: "POST",
          credentials: "include", // Äquivalent zu withCredentials: true
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
      console.error("Error renaming folder:", error);
      alert("Failed to rename folder.");
    }
  };
  const handleEditClick = (folderId, currentFolderName) => {
    Swal.fire({
      title: "Edit Folder Name",
      input: "text",
      inputLabel: "New Folder Name",
      inputValue: currentFolderName, // Set the current folder name as the default value
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a new folder name";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newFolderName = result.value;
        handleRenameSubmit(folderId, newFolderName); // Pass folderId and new name for renaming
      }
    });
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
        const response = await customFetch("http://localhost:3000/search/", {
          method: "POST",
          body: JSON.stringify({ query: searchQueryParam, limit: 10 }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        setResults(data);
        console.log(data);
      } catch (error) {
        setError("Error occurred while searching. Please try again.");
        console.error("Search error:", error);
      }
    };

    if (searchQueryParam) {
      fetchSearchResults();
    }
  }, [searchQueryParam]);

  console.log("results", results);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {searchQueryParam ? (
        <div>
          <h3 className="text-xl px-4 pt-2 pb-4 text-black">Search Results</h3>
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-black">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-4 text-black">Name</th>

                    <th className="text-left py-2 px-4">Relevance</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.map((file, index) => (
                    <File file={file} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <h3 className="text-[1rem] text-black/50 flex items-center justify-center h-[70vh]">
              No Results Found :(
            </h3>
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
              <h3 className="text-lg text-black">All Folders</h3>
            </div>
          )}

          {isFileExplorerView ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="border border-black/30 p-3 min-h-[600px]">
                <div className="flex flex-col space-y-2">
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
                <span>New Folder</span>
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
