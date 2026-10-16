function failed(error) {
  const root = document.getElementById("app");
  root.textContent = "Unable to start CCC de Notes. Please rebuild the site.";
  root.setAttribute("role", "alert");
  console.error(error);
}
import("./bootstrap").then((module) => module.bootstrap()).catch(failed);
