import { MdImage } from "react-icons/md";
import { IoIosDocument } from "react-icons/io";
import { HiOutlineViewfinderCircle } from "react-icons/hi2";
import { GoDownload } from "react-icons/go";
import { MdOutlineEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { FaStar } from "react-icons/fa6";
import { customFetch } from "../utils/helpers";
const File = ({
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
  const distance = file?.distance * 100;
  let starNumbers = 0;
  let starColor = "orange";

  if (distance >= 40 && distance < 60) {
    starNumbers = 1;
  }
  if (distance >= 60 && distance < 80) {
    starNumbers = 2;
  }
  if (distance >= 80 && distance < 95) {
    starNumbers = 3;
  }
  if (distance >= 95 && distance <= 100) {
    starNumbers = 3;
    starColor = "blue";
  }
  console.log("starNumbers - star coloe", starNumbers, starColor);
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
                  <FaStar style={{ color: starColor }} />
                </span>
              );
            })}
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
  );
};

export default File;
