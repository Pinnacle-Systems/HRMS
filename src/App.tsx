import "./App.css";
import { AuthProvider } from "./auth/AuthProvider";
import { TokenExpiryWarning } from "./components/TokenExpiryWarning";
import { PasswordPolicyProvider } from "./context/PasswordPolicyContext";
import { UIProvider } from "./context/Snackbar";
// import "./routes/Approutes";
import AppRoutes from "./routes/Approutes";

function App() {
  return (
    <PasswordPolicyProvider>
      <div className="!bg-gray-50 text-gray-900">
        <UIProvider>
          <AuthProvider>
            {/* Token expiry warning components */}
            <TokenExpiryWarning 
              warningThreshold={150} // Show warning when 2 minutes remaining
              checkInterval={5} // Check every 5 seconds
            />
            {/* <TokenExpiryModal /> Optional: modal for critical expiry */}
            
            <AppRoutes />
          </AuthProvider>
        </UIProvider>
      </div>
    </PasswordPolicyProvider>
  );
}

export default App;
