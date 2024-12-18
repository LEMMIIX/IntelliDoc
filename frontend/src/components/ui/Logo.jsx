/**
 * Die `Logo`-Komponente zeigt das Logo der Anwendung an.
 * @Author Farah. 
 */

import "../../styles/index.css";
import intellidoc_logo from "/src/assets/intellidoc_logo.webp";
function Logo() {
  return (
    <div className="text-black text-xl text-center font-semibold tracking-wider flex items-center justify-center gap-1">
          <img
              src={intellidoc_logo}
              alt="Logo"
              className="w-auto h-auto"
              style={{ width: '30px', height: '45px' }}
          /> {/* Neue Bildquelle */}
          <span className="text-black-2 mt-1">IntelliDoc</span>
    </div>
  );
}

export default Logo;