import "./App.css";
import { UIProvider } from "./context/Snackbar";
import "./routes/Approutes";
import AppRoutes from "./routes/Approutes";

function App() {
  return (
    <div className="bg-white text-gray-900">
      <UIProvider>
        <AppRoutes />
      </UIProvider>
    </div>
  );
}

export default App;
