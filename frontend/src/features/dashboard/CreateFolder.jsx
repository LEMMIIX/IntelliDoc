/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaFolder } from "react-icons/fa";
import { customFetch } from "../../utils/helpers";

const backendUrl = "http://localhost:3000";

const CreateFolderForm = ({ parentFolderId }) => {
  console.log("parentFolderId", parentFolderId)
  const [isCreating, setIsCreating] = useState(false);

  const [folderName, setFolderName] = useState("");

  const [message, setMessage] = useState("");

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await customFetch(backendUrl + "/folders/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName, parentFolderId }),
      });
      const data = await response.json();
      if (data.folderId) {
        setMessage("Folder created successfully");
        // fetchParentFolders()
        window.location.reload();
      } else {
        setMessage(data?.message || "Error creating folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setMessage("An error occurred while creating the folder.");
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
          placeholder="Folder Name"
          className="rounded-md flex-grow border border-stroke bg-white p-3 pr-4.5 text-black focus:border-primary focus-visible:outline-none "
          required
        />

        <button
          disabled={isCreating}
          type="submit"
          className=" bg-success text-white p-2 rounded-lg flex items-center gap-2 mx-auto focus:border-success/20 focus-visible:outline-none"
        >
          {isCreating ? (
            "Creating"
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
