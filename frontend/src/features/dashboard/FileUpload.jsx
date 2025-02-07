/**
 * @file FileUpload.jsx - Datei-Upload-Komponente
 * @author Farah
 * @description Komponente zum Hochladen von Dokumenten in einen spezifischen Ordner
 * 
 * @requires react
 * @requires react-icons/fi
 * @requires ../../utils/fetchFoldersTree
 * @requires ../../utils/helpers
 * @requires ../../production-config
 */

/* eslint-disable no-unused-vars */
import { useState, useEffect, Fragment } from "react";
import { FiFile } from "react-icons/fi";
import { fetchAndRenderFolderTree } from "../../utils/fetchFoldersTree";
import { customFetch } from "../../utils/helpers";
import prodconfig from "../../production-config";

/**
 * @typedef {Object} FileUploadState
 * @property {boolean} isUploading - Status des Upload-Vorgangs
 * @property {File|null} selectedFile - Die ausgewählte Datei für den Upload
 */

/**
 * @component FileUpload
 * @description Formular-Komponente zum Hochladen von Dateien mit Fortschrittsanzeige
 * und Statusmeldungen
 * 
 * @param {Object} props - Komponenten-Props
 * @param {string|number} props.folderId - ID des Zielordners für den Upload
 * 
 * @returns {JSX.Element} Die gerenderte FileUpload-Komponente
 */
const FileUpload = ({ folderId }) => {
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  // Handle form submission
  /**
 * @function handleSubmit
 * @description Verarbeitet die Formular-Übermittlung für den Datei-Upload
 * 
 * @param {Event} e - Das Submit-Event des Formulars
 * @throws {Error} Bei fehlgeschlagener Server-Anfrage oder fehlenden Eingaben
 * @returns {void}
 * 
 * @note Verwendet FormData für den Datei-Upload und enthält:
 * - file: Die hochzuladende Datei
 * - folderId: Die ID des Zielordners
 */
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsUploading(true);
    if (!selectedFile || !folderId) {
      alert("Bitte wähle eine Datei und einen Ordner aus.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folderId", folderId);

    customFetch(`${prodconfig.backendUrl}/docupload`, {
      credentials: "include",
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        //alert("Datei erfolgreich hochgeladen");
        window.location.reload();
      })
      .catch((error) => {
        alert(
          "Beim Hochladen der Datei ist ein Fehler aufgetreten. Versuche es bitte erneut!"
        );
        window.location.reload();
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <div>
      <div className="rounded-sm border border-stroke bg-white shadow-default">
        <div className="border-b border-stroke py-4 px-6.5 ">
          <h3 className="font-medium text-black">Dokument hochladen</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5.5 p-6.5">
          <div>
            <label className="mb-3 block text-black">Datei anhängen</label>
            <input
              type="file"
              name="datei"
              required
              disabled={isUploading}
              onChange={(e) => {
                return setSelectedFile(e.target.files[0]);
              }}
              className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition file:mr-5  file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter"
            />
          </div>

          <button
            disabled={isUploading}
            className=" p-2 border border-stroke rounded-lg bg-primary text-white hover:bg-opacity-75 duration-200 transition-colors flex items-center gap-1 justify-center disabled:cursor-not-allowed disabled:hover:bg-primary"
            type="submit"
          >
            {isUploading ? (
              "Wird hochgeladen..."
            ) : (
              <>
                <span> Hochladen</span>
                <FiFile />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FileUpload;
