import "./App.css";
import { PasswordPolicyProvider } from "./context/PasswordPolicyContext";
import { UIProvider } from "./context/Snackbar";
import "./routes/Approutes";
import AppRoutes from "./routes/Approutes";

function App() {
  return (
    <PasswordPolicyProvider>
      <div className="!bg-gray-50 text-gray-900">
        <UIProvider>
          <AppRoutes />
        </UIProvider>
      </div>
    </PasswordPolicyProvider>
  );
}

export default App;
