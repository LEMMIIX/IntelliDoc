import { MdImage } from "react-icons/md";
import { IoIosDocument } from "react-icons/io";
import { HiOutlineViewfinderCircle } from "react-icons/hi2";
import { GoDownload } from "react-icons/go";
import { MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { FaStar } from "react-icons/fa6";
import { customFetch } from "../utils/helpers";
import Swal from "sweetalert2";
const backendUrl = "http://localhost:3000";

function getRelevance(results) {
  if (results.length === 0) {
    return;
  }

  // Sort results by relevance (highest first)
  results.sort((a, b) => b.distance - a.distance);

  const bestScore = results[0].distance; // Highest score in the set
  const worstScore = results[results.length - 1].distance; // Lowest score in the set
  const scoreRange = bestScore - worstScore; // Range of scores

  let resultsArray = [];

  results.forEach((result, index) => {
    const relevance = result.distance.toFixed(2);

    // Normalize the score to a scale of 0 to 1
    const normalizedScore =
      scoreRange > 0 ? (result.distance - worstScore) / scoreRange : 1;

    // Dynamic star rating based on relative position and absolute value
    let starNumbers = 0;
    let starColor = "orange";
    let fontSize = "";
    let description = "am besten";
    if (index === 0 && bestScore >= 50) {
      // Best result over 50%: 3 stars in blue
      starNumbers = 5;
      starColor = "orange";
      fontSize = "22px";
    } else if (bestScore >= 30 && result.distance >= 30) {
      // Results over 30% (relatively speaking): 2 or more stars
      if (normalizedScore >= 0.75) {
        starNumbers = 3;
      } else {
        starNumbers = 2;
      }
    } else {
      // Low relevance: 1 star in yellow for anything under 30%
      starNumbers = 1;
      description = "gut";
    }

    resultsArray.push({
      fileId: result.id,
      starNumbers,
      starColor,
      relevance,
      fontSize,
      description,
    });
  });

  return resultsArray;
}

const File = ({
  results = null,
  setResults = null,
  searchQueryParam = null,
  file,
  isDeleting,
  isDownloading,
  handleFilePreview,
  handleFileDownload,
  setSelectedDocToRename,
  setIsPopupVisible,
  handleFileDelete,
  currentlyPreviewedFile = null,
  setCurrentlyPreviewedFile = null,
  filePreviewContent = null,
  setFilePreviewContent = null,
}) => {
  //const distance = file?.distance * 100;
  //let starNumbers = 0;
  //let starColor = "orange";

  //  if (distance >= 40 && distance < 60) {
  //  starNumbers = 1;
  //}
  //if (distance >= 60 && distance < 80) {
  //starNumbers = 2;
  //}
  //if (distance >= 80 && distance < 95) {
  //starNumbers = 3;
  //}
  //if (distance >= 95 && distance <= 100) {
  //starNumbers = 3;
  //starColor = "blue";
  //}
  //console.log("starNumbers - star coloe", starNumbers, starColor);

  let starNumbers = 0;
  let starColor = "orange";
  let fontSize = "";
  let description = "Best Score";

  const relevanceResults = getRelevance(results);

  const relevance = relevanceResults.find((r) => r.fileId === file.id);

  if (relevance) {
    starNumbers = relevance.starNumbers;
    starColor = relevance.starColor;
    fontSize = relevance.fontSize;
    description = relevance.description;
  }

  const fetchSearchResults = async () => {
    try {
      const response = await customFetch("http://localhost:3000/search/", {
        method: "POST",
        body: JSON.stringify({ query: searchQueryParam, limit: 10 }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setResults(data);
      window.location.reload();
      console.log("---Refetch for delete action---");
    } catch (error) {
      //setError("Error occurred while searching. Please try again.");
      console.error("Search error:", error);
    }
  };

  return (
    <tr key={file.id} className="border-b last:border-b-0 border-slate-200">
      <td
        className="py-2 px-4 flex items-center gap-1"
        onClick={() => handleFilePreview(file.name)}
      >
        {["png", "jpg", "jpeg", "gif"].includes(file.name.split(".").pop()) ? (
          <MdImage className="text-success text-lg" />
        ) : (
          <IoIosDocument
            className={`text-lg ${
              file.name.split(".").pop() === "pdf" && "text-danger"
            } ${
              ["word", "docx", "odt", "odt", "txt"].includes(
                file.name.split(".").pop()
              ) && "text-blue-600"
            }`}
          />
        )}
        <span>{file.name}</span>
      </td>
      <td>
        <div className="flex items-center gap-1">
          {starNumbers > 0 &&
            Array.from({ length: starNumbers }).map((_) => {
              return (
                <span>
                  <FaStar style={{ color: starColor, fontSize: fontSize }} />
                </span>
              );
            })}
          ({description})
        </div>
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
            onClick={async () => {
              // Extrahiere die Dateierweiterung und den Dateinamen ohne Erweiterung
              const fileExtension = file.name.split(".").pop(); // Extrahiert die Dateierweiterung
              const fileNameWithoutExtension = file.name.replace(`.${fileExtension}`, ""); // Entfernt die Erweiterung aus dem Namen

              const { value: newName } = await Swal.fire({
                title: "Rename File",
                input: "text",
                inputLabel: "New File Name",
                inputValue: fileNameWithoutExtension, // Zeigt nur den Namen ohne Erweiterung an
                showCancelButton: true,
                confirmButtonText: "Speichern",
                inputValidator: (value) => {
                  if (!value) return "You need to enter a file name!";
                },
              });

              if (newName) {
                // Füge die ursprüngliche Dateierweiterung wieder hinzu
                const fullFilename = `${newName}.${fileExtension}`;
                try {
                  const response = await customFetch(`${backendUrl}/folders/rename`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      documentId: file.id,
                      newFilename: fullFilename, // Sende den neuen Namen mit der ursprünglichen Erweiterung
                    }),
                  });
                  if (!response.ok) throw new Error("Failed to rename file");

                  await Swal.fire("Success!", "File renamed successfully", "success");
                  window.location.reload();
                } catch (error) {
                  await Swal.fire("Error!", "Failed to rename file", "error");
                  console.error("Error renaming file:", error);
                }
              }
            }}
            className="hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
          >
            <MdOutlineEdit className="text-lg" />
          </button>
          <button
            disabled={isDeleting || isDownloading}
            onClick={() => {
              handleFileDelete(file.id);
              fetchSearchResults();
            }}
            className="text-danger hover:bg-black/10 p-1 flex justify-center items-center rounded-full duration-150 transition-colors"
          >
            <AiOutlineDelete className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default File;
