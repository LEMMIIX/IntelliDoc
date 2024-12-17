/**
 * Diese Datei enthält die Breadcrumbs-Komponente.
 * Sie ermöglicht die Navigation innerhalb der Ordnerstruktur und das Umschalten zwischen verschiedenen Ansichten.
 *
 * @autor Farah. 
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

import { useNavigate } from "react-router-dom";
import { FaFile, FaFolder, FaMinus, FaPlus } from "react-icons/fa6";
import { FaThList } from "react-icons/fa";
import { getPathID } from "../../utils/helpers";

const Breadcrumbs = ({
  path = null,
  isFileExplorerView = null,
  folderPathArray = null,
  folders = null,
  toggleView = null,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between w-full">
      <span className="flex items-center gap-1">
        <div className="py-2">
          <svg
            onClick={() => {
              navigate("/dashboard");
            }}
            className="cursor-pointer"
            width="15"
            height="15"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.5522 14.3554V8.81896C15.5522 7.91739 15.1826 7.05528 14.5299 6.43432L9.2928 1.45227C8.65893 0.849243 7.66431 0.849243 7.03045 1.45227L1.79337 6.43432C1.14059 7.05528 0.770996 7.91739 0.770996 8.81896V14.3554C0.770996 15.2637 1.50631 16 2.41336 16H13.9099C14.817 16 15.5522 15.2637 15.5522 14.3554Z"
              stroke="#9B9B9B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {path &&
          folderPathArray.map((path, index) => {
            const folderId = getPathID(folders, path);
            return (
              <div key={`${path}-${index}`} className="flex items-center">
                <span
                  className={`cursor-pointer px-0.5 hover:scale-105 ${
                    folderPathArray.length - 1 === index
                      ? "text-black"
                      : "text-black/50"
                  }`}
                  onClick={() => {
                    navigate(`/folders/${folderId}`);
                  }}
                >
                  {path}
                </span>
                {folderPathArray.length - 1 !== index && (
                  <span className="text-black/50">/</span>
                )}
              </div>
            );
          })}
      </span>
      <div>
        <button
          onClick={toggleView}
          className="bg-gray-200 rounded-md hover:bg-gray-300 flex items-center"
        >
          <FaFolder
            className={`mr-2 ${
              !isFileExplorerView ? "text-blue-300" : "text-blue-500"
            } text-lg`}
          />
          <FaThList
            className={`mr-2 ${
              !isFileExplorerView ? "text-blue-500" : "text-blue-300"
            } text-lg`}
          />
        </button>
      </div>
    </div>
  );
};

export default Breadcrumbs;
