import "../../styles/index.css";
function Logo() {
  return (
    <div className="text-black text-xl text-center font-semibold tracking-wider flex items-center justify-center gap-1">
      <img style={{width:'25px'}} src="/public/intellidoc2.jpeg" alt="Logo" className="w-32 h-auto" />
      <span className="text-black-2 mt-1 ">IntelliDoc</span>
    </div>
  );
}

export default Logo;