import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home_main">
      <h1 className="home_title"> Welcome to IntelliDoc </h1>

      <div className="home_login_container">
        <p>Please log in to access your files</p>
        <Link to="/login" className="button">
          Log in
        </Link>
      </div>
      <ul className="home_members">
        <li> Members:</li>
        <li>Belbaraka, Ayoub</li>
        <li>Bouaasria, Farah</li>
        <li>Dablaq, Ilyass</li>
        <li>Kilic, Miray-Eren</li>
        <li>Moeller, Lennart</li>
        <li>Neumann, Luca</li>
      </ul>
    </main>
  );
}

export default Home;
