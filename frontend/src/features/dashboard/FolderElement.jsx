/**
 * @file FolderElement.jsx - Ordner-Element-Komponente
 * @author Farah
 * @description Komponente zur Darstellung und Verwaltung eines einzelnen Ordners
 * mit Optionen zum Navigieren, Umbenennen und Löschen
 * 
 * @requires react
 * @requires react-router-dom
 * @requires react-icons/bs
 * @requires ../../utils/helpers
 * @requires ../../production-config
 */

import { useNavigate } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useState, useEffect, useRef } from "react";
import { customFetch } from "../../utils/helpers";
import prodconfig from "../../production-config";

/**
 * @typedef {Object} FolderElementState
 * @property {boolean} showFolderOptions - Steuert die Anzeige des Optionsmenüs
 * @property {boolean} isPopupVisible - Steuert die Anzeige des Umbenennen-Popups
 * @property {string} newFolderName - Neuer Name für den Ordner
 * @property {boolean} isLoading - Status des Umbenennungsvorgangs
 * @property {string} inputError - Validierungsfehler für die Eingabe
 * @property {string} errorMessage - Allgemeine Fehlermeldungen
 */

/**
 * @component FolderElement
 * @description Rendert ein einzelnes Ordner-Element mit Interaktionsmöglichkeiten
 * 
 * @param {Object} props - Komponenten-Props
 * @param {string|number} props.folderId - Eindeutige ID des Ordners
 * @param {string} props.folderName - Name des Ordners
 * @param {Function} props.handleFolderDelete - Callback für das Löschen des Ordners
 * 
 * @returns {JSX.Element} Die gerenderte FolderElement-Komponente
 */
function FolderElement({ folderId, folderName, handleFolderDelete }) {
  const navigate = useNavigate();
  const [showFolderOptions, setShowFolderOptions] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folderName);
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const popupRef = useRef(null);
  const folderOptionsRef = useRef(null); // Reference for folder options

  /**
 * @function handleRenameFolder
 * @async
 * @description Verarbeitet die Umbenennung eines Ordners
 * @throws {Error} Bei fehlgeschlagener Server-Anfrage
 * @returns {Promise<void>}
 */
  const handleRenameFolder = async () => {
    if (inputError != "") {
      return;
    }

    setIsLoading(true);
    try {
      // Sende die Anfrage mit dem richtigen Content-Type
      const response = await customFetch(
        `${prodconfig.backendUrl}/folders/renameFolder`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json", // Setze den richtigen Content-Type
          },
          body: JSON.stringify({
            folderId: folderId,
            newFolderName: newFolderName,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Fehler beim Umbenennen des Ordners");
      }
      // Antwort vom Backend einlesen, falls erfolgreich
      const data = await response.json();
      setIsPopupVisible(false);
      setIsLoading(false);
      //alert("Ordnername erfolgreich geändert!");
      window.location.reload();
    } catch (e) {
      console.log("error: ", e);
      setErrorMessage(
        e.message || "Beim Umbenennen des Ordners ist etwas schiefgelaufen."
      );
      setIsLoading(false);
    }
  };

  /**
 * @function handleRenameFolderInput
 * @description Validiert die Eingabe beim Umbenennen eines Ordners
 * @param {Event} e - Das Change-Event des Eingabefelds
 * @returns {void}
 */
  const handleRenameFolderInput = (e) => {
    let newFileName = e.target.value;
    setNewFolderName(newFileName);

    switch (newFileName) {
      case folderName:
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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupVisible(false);
        +setInputError(""); // Clear error when popup closes
      }
    };

    if (isPopupVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupVisible]);

  // Close folder options when clicking outside
  useEffect(() => {
    const handleClickOutsideOptions = (event) => {
      if (
        folderOptionsRef.current &&
        !folderOptionsRef.current.contains(event.target)
      ) {
        setShowFolderOptions(false);
      }
    };

    if (showFolderOptions) {
      document.addEventListener("mousedown", handleClickOutsideOptions);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideOptions);
    };
  }, [showFolderOptions]);

  return (
    <>
      <li
        tabIndex={0}
        key={folderId}
        className="bg-white border-lg p-4 flex flex-col gap-1 justify-center rounded-lg duration-200 transition-opacity shadow-sm relative "
      >
        <svg
          width="70"
          height="70"
          viewBox="0 0 98 82"
          className="mx-auto cursor-pointer"
          onClick={() => navigate(`/folders/${folderId}`)}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect y="6.64404" width="98" height="74.7458" rx="5" fill="#3D65F2" />
          <path
            d="M0 4C0 1.79086 1.79086 0 4 0H26.1567C27.5758 0 28.8887 0.751897 29.6068 1.9759L32.3156 6.59312C33.3141 8.29504 32.9223 10.4708 31.3929 11.7176L29.5511 13.219C28.8373 13.8009 27.9446 14.1186 27.0237 14.1186H4C1.79086 14.1186 0 12.3278 0 10.1186V4Z"
            fill="#3D65F2"
          />
          <rect
            y="8.30518"
            width="98"
            height="73.0847"
            rx="5"
            fill="url(#paint0_linear_89_82)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_89_82"
              x1="91.3559"
              y1="110.458"
              x2="26.161"
              y2="19.9323"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#435199" />
              <stop offset="1" stopColor="#7087FF" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex justify-between">
          <span
            className="text-sm flex-grow text-center hover:text-primary cursor-pointer"
            onClick={() => navigate(`/folders/${folderId}`)}
          >
            {folderName}
          </span>
          <BsThreeDotsVertical
            className={`cursor-pointer hover:text-primary ${
              folderId === showFolderOptions && "text-primary"
            }`}
            onClick={() => {
              showFolderOptions === folderId
                ? setShowFolderOptions(null)
                : setShowFolderOptions(folderId);
            }}
          />
        </div>
        {showFolderOptions === folderId && (
          <div
            className="absolute z-99 translate-y-full -bottom-1 shadow-md right-0 flex flex-col bg-white w-2/3 sm:w-full rounded-lg p-2 gap-2"
            ref={folderOptionsRef} // Reference to detect clicks outside
          >
            <span
              className="flex gap-1 cursor-pointer px-2 py-2 rounded-md hover:bg-[#363D4410] hover:text-danger items-center transition-colors duration-200"
              onClick={() => handleFolderDelete(folderId)}
            >
              Löschen
            </span>
            <span
              className="flex gap-1 cursor-pointer px-2 py-2 rounded-md hover:bg-[#363D4410] hover:text-primary items-center transition-colors duration-200"
              onClick={() => {
                setIsPopupVisible(true);
                setShowFolderOptions(false);
              }}
            >
              Umbenennen
            </span>
          </div>
        )}
      </li>
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="bg-white rounded-md px-6 shadow-lg max-w-md w-full"
            ref={popupRef} // Reference to detect clicks outside
          >
            <h2 className="text-2xl font-semibold	 py-4 text-center text-[hsl(0,0%,33%)]">
              Ordner umbenennen
            </h2>
            <h1 className="text-sm font-normal py-4 text-center text-[hsl(0,0%,33%)]">
              Neuer Ordnername
            </h1>
            <div>
              <input
                type="text"
                value={newFolderName}
                onChange={handleRenameFolderInput}
                className={`rounded-md placeholder:text-md border-[1.5px] border-transparent ${
                  inputError &&
                  "border-red-500 placeholder:text-red-500 focus:border-red-500"
                } bg-black/10 p-3 text-black/70 focus:border-primary focus-visible:outline-none w-full`}
                placeholder="New folder name"
                autoFocus
              />
              {inputError && (
                <span className="text-red-500 text-sm">{inputError}</span>
              )}
              {errorMessage && (
                <div className="error-message text-red-500 text-ms">
                  {errorMessage}
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6 pb-5">
              <button
                onClick={handleRenameFolder}
                className={`bg-[#436BF5] text-white px-4 py-2 rounded-md hover:bg-[#426AF3] transition duration-200 ease-in-out mr-2 ${
                  (isLoading || inputError) &&
                  "cursor-not-allowed bg-opacity-50 hover:bg-opacity-50"
                }`}
                disabled={isLoading || inputError}
              >
                {isLoading ? "Wird geladen..." : "Speichern"}
              </button>
              <button
                onClick={() => {
                  setIsPopupVisible(false);
                  setInputError("");
                }}
                className="bg-[#6e7881] text-white px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200 ease-in-out"
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

export default FolderElement;
