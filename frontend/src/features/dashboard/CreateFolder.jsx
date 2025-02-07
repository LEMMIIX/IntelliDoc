/**
 * @file CreateFolder.jsx - Ordnererstellungs-Komponente
 * @author Farah
 * @description Komponente zur Erstellung neuer Ordner innerhalb einer bestehenden Ordnerstruktur
 * 
 * @requires react
 * @requires react-icons/fa
 * @requires ../../utils/helpers
 * @requires ../../production-config
 */

/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaFolder } from "react-icons/fa";
import { customFetch } from "../../utils/helpers";
import prodconfig from "../../production-config";

/**
 * @typedef {Object} CreateFolderState
 * @property {boolean} isCreating - Status des Erstellungsvorgangs
 * @property {string} folderName - Name des zu erstellenden Ordners
 * @property {string} message - Statusnachricht für den Benutzer
 */

/**
 * @component CreateFolderForm
 * @description Formular-Komponente zum Erstellen eines neuen Ordners
 * 
 * @param {Object} props - Komponenten-Props
 * @param {string|number} props.parentFolderId - ID des übergeordneten Ordners
 * 
 * @returns {JSX.Element} Die gerenderte CreateFolderForm-Komponente
 */
const CreateFolderForm = ({ parentFolderId }) => {
  console.log("parentFolderId", parentFolderId);
  const [isCreating, setIsCreating] = useState(false);

  const [folderName, setFolderName] = useState("");

  const [message, setMessage] = useState("");

  /**
 * @function handleCreateFolder
 * @async
 * @description Verarbeitet die Formular-Übermittlung zum Erstellen eines neuen Ordners
 * 
 * @param {Event} e - Das Submit-Event des Formulars
 * @throws {Error} Bei fehlgeschlagener Server-Anfrage
 * @returns {Promise<void>}
 */
  const handleCreateFolder = async (e) => {
    e.preventDefault();
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
          body: JSON.stringify({ folderName, parentFolderId }),
        }
      );
      const data = await response.json();
      if (data.folderId) {
        setMessage("Ordner erfolgreich erstellt");
        // fetchParentFolders()
        window.location.reload();
      } else {
        setMessage(data?.message || "Fehler beim Erstellen des Ordners");
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Ordners:", error);
      setMessage("Es ist ein Fehler beim Erstellen des Ordners aufgetreten.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="my-4">
      {message && (
        <div className="text-center mb-4 text-xl bg-success/20 text-success p-2 rounded-lg">
          {message}
        </div>
      )}
      <form
        onSubmit={handleCreateFolder}
        className="bg-white shadow-sm p-4 rounded-xl border border-stroke mb-7 flex flex-wrap items-center gap-4"
      >
        <input
          type="text"
          disabled={isCreating}
          value={folderName}
          onChange={(e) => {
            setMessage("");

            setFolderName(e.target.value);
          }}
          placeholder="Ordnername"
          className="rounded-md flex-grow border border-stroke bg-white p-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none "
          required
        />

        <button
          disabled={isCreating}
          type="submit"
          className=" bg-success text-white p-2 rounded-lg flex items-center gap-2 mx-auto focus:border-success/20 focus-visible:outline-none"
        >
          {isCreating ? (
            "Erstellen"
          ) : (
            <>
              <span>Erstellen</span>
              <FaFolder />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateFolderForm;
