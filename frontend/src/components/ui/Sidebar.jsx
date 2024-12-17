/* eslint-disable react/prop-types */
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaRegFolder } from "react-icons/fa";
import Logo from "./Logo";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import { useEffect, useState } from "react";
import {
  IoConstruct,
  IoConstructOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { fetchAndRenderFolderTree } from "../../utils/fetchFoldersTree";
import { userLogout } from "../../utils/userLogout";
import { fetchAndRenderFolder } from "../../utils/fetchFoldersTree";
import Swal from "sweetalert2";
import { customFetch } from "../../utils/helpers";
import prodconfig from "../../production-config";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const userName = localStorage.getItem("currentUserName") || "";
  const [folders, setFolders] = useState([]);
  const [showMenuUpload, setShowMenuUploads] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileOptions, setProfileOptions] = useState(false);
  const [uploadFileHTML, setUploadFileHTML] = useState(
    '<input class="width: fit" type="file" id="fileInput" class="swal2-input" accept="*/*">'
  );

  const { folderId } = useParams();
  const navigate = useNavigate();
  // Sidebar Class name
  const sidebarClasses = `absolute left-0 top-0 z-9999 flex h-screen w-60 flex-col overflow-y-hidden bg-[#EBEBEB] duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 border-r border-r-slate-300 ${
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  }`;

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await customFetch(
          `${prodconfig.backendUrl}/api/current-user`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Überprüfung des Admin-Status:", data); // Debug log
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error("Fehler beim Überprüfen des Admin-Status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  const userLogout = async () => {
    try {
      const response = await customFetch(
        `${prodconfig.backendUrl}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (response.ok) {
        localStorage.clear(); // Clear all localStorage items
        navigate("/auth/login");
      }
    } catch (error) {
      console.error("Abmeldung fehlgeschlagen:", error);
    }
  };

  const goToAdminDashboard = () => {
    navigate("/admin"); // Navigate to the Admin Dashboard route
  };

  const handleUploadFile = async () => {
    let fileInfo;

    const { value: fileStep } = await Swal.fire({
      title: "Wähle eine Datei",
      html: '<input type="file" id="fileInput" class="swal2-input" accept="*/*">',
      showCancelButton: true,
      confirmButtonText: "Hochladen",
      cancelButtonText: "Abbrechen",
      focusConfirm: false,
      preConfirm: async () => {
        const selectedFile = document.getElementById("fileInput").files[0];

        if (!selectedFile) {
          Swal.showValidationMessage("Bitte wähle eine Datei aus");
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
          const response = await customFetch(
            `${prodconfig.backendUrl}/docupload/smart`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error("Fehler beim Hochladen der Datei");
          }

          const data = await response.json();
          fileInfo = data; // Extract the folders or data you need
          return true; // Proceed to the next step
        } catch (error) {
          Swal.showValidationMessage(
            "Datei-Upload fehlgeschlagen. Bitte versuche es erneut."
          );
          console.error(error);
          return false; // Stay on this step
        }
      },
    });

    if (!fileStep) return; // User cancelled

    // Step 2: Send Additional Request
    const { value: submitStep } = await Swal.fire({
      title: "Vorgeschlagene Ordner",
      html: `
      <style>
        .swal2-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .swal2-table th, .swal2-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .swal2-table th {
          background-color: #f4f4f4;
          font-weight: bold;
        }
        .swal2-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .swal2-table tr:hover {
          background-color: #f1f1f1;
        }
      </style>
      <div>
        <div></div>
      </div>
      <table class="swal2-table">
        <thead>
          <tr>
            <th>Ordnername</th>
            <th>Auswählen</th>
          </tr>
        </thead>
        <tbody>
          ${
            fileInfo?.folderSuggestions
              ?.map(
                (folder, index) => `
                  <tr>
                    <td>${folder.folderName}</td>
                    <td>
                     <input type="radio" id="selectedFolder" name="selectedFolder" value="${
                       folder.folderId
                     }" ${index === 0 ? "checked" : ""} />
                    </td>
                  </tr>
                `
              )
              .join("") ||
            "<tr><td colspan='2'>Keine Ordner verfügbar</td></tr>"
          }
        </tbody>
      </table>
    `,
      showCancelButton: true,
      confirmButtonText: "Absenden",
      cancelButtonText: "Abbrechen",
      preConfirm: async () => {
        const selectedFolder = document.querySelector(
          'input[name="selectedFolder"]:checked'
        );
        const folderId = selectedFolder?.value;

        if (!selectedFolder) {
          Swal.showValidationMessage("Bitte wähle einen Ordner aus");
          return;
        }

        try {
          const response = await customFetch(
            `${prodconfig.backendUrl}/docupload/assign-folder`,
            {
              method: "POST",
              body: JSON.stringify({
                fileId: String(fileInfo.fileId),
                folderId,
              }),
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (!response.ok) {
            throw new Error("Fehler beim Hochladen der Datei");
          }

          // const data = await response.json();
          return true; // Pass to the final action
        } catch (e) {
          return false;
        }
      },
    });

    if (submitStep) {
      Swal.fire("Erfolg", "Ihre Daten wurden eingereicht!", "success").then(
        () => {
          // Optional: Erneut laden oder schließen
          console.log("Popup geschlossen und Aktion abgeschlossen");
        }
      );
    }
  };

  return (
    <aside className={sidebarClasses}>
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-4 py-6 lg:py-5 ">
        <NavLink to="/dashboard">
          <Logo />
        </NavLink>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden  transition duration-200"
        >
          <FaArrowLeft className="text-black-2 hover:text-primary" />
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}

        <nav className="py-4 px-4 lg:mt-0 lg:px-6 ">
          {/* <!-- Menu Group --> */}
          <h3
            className="mb-4 text-sm font-semibold text-black flex gap-2 items-center cursor-pointer"
            onClick={() => setProfileOptions((p) => !p)}
          >
            <span className="bg-purple-700 bg-opacity-40 h-7 w-7 flex justify-center items-center rounded-full text-white">
              {userName.split("")[0]}
            </span>
            <span>{userName}</span>
            <FiChevronDown className="ml-auto" />
          </h3>
          {profileOptions && (
            <ul className="bg-white my-4 rounded-lg p-2 space-y-3">
              <li
                className="flex gap-1 cursor-pointer px-2 py-2 rounded-md hover:bg-[#363D4410] hover:text-danger items-center transition-colors duration-200"
                onClick={() => userLogout(navigate)}
              >
                <IoLogOutOutline />
                <span>Abmelden</span>
              </li>

              {/* Only show admin button if user is admin */}
              {isAdmin && (
                <li
                  className="flex gap-1 cursor-pointer px-2 py-2 rounded-md hover:bg-[#363D4410] hover:text-primary items-center transition-colors duration-200"
                  onClick={() => navigate("/admin")}
                >
                  <IoConstructOutline />
                  <span>Admin Dashboard</span>
                </li>
              )}
            </ul>
          )}

          {/* Add menu start */}
          <button
            className="btn-gradient px-2 py-2 flex items-center rounded-lg w-full my-4"
            onClick={() => setShowMenuUploads((p) => !p)}
          >
            <span className="flex-1 border-r-2">Hinzufügen</span>
            <FiPlus className="m-1 text-lg" />
          </button>
          {showMenuUpload && (
            <ul className="bg-white my-4 rounded-lg py-3 px-2 space-y-3">
              <li className="flex gap-1 cursor-pointer px-2 py-2 rounded-md hover:bg-[#363D4410]   items-center transition-colors duration-200">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 23 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.4582 13.75V7.375M11.4582 7.375L8.17117 9.5M11.4582 7.375L14.7452 9.5M1.59717 3.125V14.6C1.59717 15.7901 1.59717 16.3848 1.83601 16.8393C2.0461 17.2391 2.38108 17.5649 2.79342 17.7686C3.26171 18 3.87505 18 5.09992 18H17.8164C19.0413 18 19.6538 18 20.122 17.7686C20.5343 17.5649 20.8705 17.2394 21.0805 16.8395C21.3194 16.385 21.3194 15.7899 21.3194 14.5998V6.52477C21.3194 5.33465 21.3194 4.7396 21.0805 4.28504C20.8705 3.88519 20.5346 3.56034 20.1223 3.35661C19.6535 3.125 19.0403 3.125 17.813 3.125H11.4582M1.59717 3.125H11.4582M1.59717 3.125C1.59717 1.95139 2.57826 1 3.7885 1H7.81455C8.35053 1 8.61914 1 8.87134 1.05871C9.09494 1.11077 9.30836 1.19684 9.50438 1.31335C9.72548 1.44473 9.91525 1.62881 10.294 1.99609L11.4582 3.125"
                    stroke="#363D44"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="text-sm"
                  onClick={() => {
                    handleUploadFile();
                  }}
                >
                  Dokument hochladen
                </span>
              </li>
            </ul>
          )}
          {/* Add menu end */}
          <ul className="space-y-3">
            {folders.folderTree?.map((folder, index) => {
              return (
                <li
                  key={folder.id}
                  className={`flex gap-1 cursor-pointer p-2 rounded-xl hover:bg-[#363D4415] pl-6 items-center transition-colors duration-200 bg-transparent ${
                    folder.id == folderId ? "bg-[#363D4415]" : "bg-transparent"
                  }`}
                  onClick={() => navigate(`/folders/${folder.id}`)}
                >
                  <FaRegFolder className="text-[#363D44] text-sm mb-1" />
                  <span className="text-sm text-[#363D44]">{folder.name}</span>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
