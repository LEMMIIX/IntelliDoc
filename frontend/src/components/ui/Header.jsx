/**
 * Diese Datei enthält die Header-Komponente.
 * Sie ermöglicht die Anzeige der Kopfzeile mit einer Suchleiste und einem Menübutton.
 *
 * @autor Farah. 
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

import { useState } from "react";
import { CgMenu } from "react-icons/cg";
import { IoMdSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isSearchSent, setIsSearchSent] = useState(false);

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent form submission from reloading the page
    if (query) {
      setIsSearchSent(true);
      navigate(`/dashboard?search=${query}`);
    }
  };

  const clearSearch = () => {
    setIsSearchSent(false);
    setQuery("");
    navigate("/dashboard");
  };

  return (
    <>
      <header className="sticky top-0 z-999 flex w-full bg-white">
        <div className="flex flex-grow items-center justify-between gap-4 px-4 py-4 md:px-6 2xl:px-11">
          <div className="hidden lg:block"></div>
          <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
            <button
              aria-controls="sidebar"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="z-99999 block rounded-md border border-stroke bg-white p-1.5 shadow-sm lg:hidden"
            >
              <CgMenu className="text-2xl" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl flex-grow relative mr-auto">
            <form
              onSubmit={handleSearch} // Handle search submission
              className="flex items-center bg-black/10 rounded-lg p-1.5"
            >
              <div className="bg-black/20 p-2 rounded-lg">
                <IoMdSearch className="text-lg text-black/60" />
              </div>
              <input
                type="text"
                placeholder="Suche nach einem Dokument..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                readOnly={isSearchSent} // Prevent typing when search is sent
                className="flex-grow bg-transparent pl-3 py-2 text-black/70 focus:border-primary focus-visible:outline-none"
              />
              {query && isSearchSent && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Suche löschen"
                >
                  ✕
                </button>
              )}
              <button type="submit" className="hidden">
                Suche
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Popup */}
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white rounded-lg shadow-lg w-3/4 max-w-lg p-5 relative">
            <button
              onClick={() => setIsPopupVisible(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">Suchergebnisse</h2>
            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ul className="space-y-2">
                {results.map((result) => (
                  <li key={result.id} className="text-black/70">
                    <span className="font-medium">{result.name}</span> (
                    {result.type})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
