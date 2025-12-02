// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import ImpLinksPage from "./pages/ImpLinksPage";

// 🔐 Hard-coded passwords (change these as you like)
const PASSWORDS = {
  office: "office123",
  personal: "personal123",
};

// Small helper to read auth from localStorage
const getInitialAuth = () => {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, workspace: null };
  }
  try {
    const saved = window.localStorage.getItem("impLinks_auth");
    if (!saved) return { isAuthenticated: false, workspace: null };
    return JSON.parse(saved);
  } catch {
    return { isAuthenticated: false, workspace: null };
  }
};

/**
 * ProtectedRoute – wraps private pages
 * - checks if user is authenticated
 * - optionally enforces which workspace is allowed for this route
 */
function ProtectedRoute({ children, workspace }) {
  const location = useLocation();
  const authRaw = getInitialAuth();

  // Not logged in at all → go to login
  if (!authRaw.isAuthenticated || !authRaw.workspace) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // If this route expects a specific workspace (office/personal),
  // and current auth.workspace doesn't match → force login again
  if (workspace && authRaw.workspace !== workspace) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

/**
 * PasswordPage – simple login page with office/personal switch
 */
function PasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspace, setWorkspace] = React.useState("office"); // office | personal
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const expected = PASSWORDS[workspace];

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password !== expected) {
      setError("Incorrect password");
      return;
    }

    // Save auth in localStorage
    const authData = {
      isAuthenticated: true,
      workspace,
    };
    window.localStorage.setItem("impLinks_auth", JSON.stringify(authData));

    // redirect to workspace route (office or personal)
    const redirectTo =
      location.state?.from && location.state.from !== "/login"
        ? location.state.from
        : workspace === "office"
        ? "/office"
        : "/personal";

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Access My Links
          </h1>
          <p className="text-md text-gray-500 mb-4">
            Choose a workspace and enter the password to continue.
          </p>

          {/* Workspace toggle */}
          <div className="flex mb-4 bg-slate-100 rounded-2xl p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setWorkspace("office")}
              className={`flex-1 py-2 rounded-2xl transition ${
                workspace === "office"
                  ? "bg-white shadow text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Office
            </button>
            <button
              type="button"
              onClick={() => setWorkspace("personal")}
              className={`flex-1 py-2 rounded-2xl transition ${
                workspace === "personal"
                  ? "bg-white shadow text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Personal
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password for {workspace === "office" ? "Office" : "Personal"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-2xl text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-95 transition-transform"
            >
              Unlock {workspace === "office" ? "Office" : "Personal"} Links
            </button>

            <p className="mt-3 text-[11px] text-gray-400">
              (Dev note: change hard-coded passwords in <b>App.jsx</b>.)
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Layout wrapper for workspace pages (top bar with Logout + which workspace)
 */
function WorkspaceLayout({ children, workspace }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.localStorage.removeItem("impLinks_auth");
    navigate("/login", { replace: true });
  };

  const otherWorkspace = workspace === "office" ? "personal" : "office";
  const otherPath = workspace === "office" ? "/personal" : "/office";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-md font-semibold text-slate-800">
              My Links
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {workspace === "office" ? "Office Workspace" : "Personal Workspace"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick switch workspace */}
            <button
              type="button"
              onClick={() => navigate(otherPath)}
              className="px-3 py-1.5 rounded-xl text-[11px] border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Switch to {otherWorkspace === "office" ? "Office" : "Personal"}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}

/**
 * RootRedirect – decides where "/" should go
 */
function RootRedirect() {
  const auth = getInitialAuth();

  if (auth.isAuthenticated && auth.workspace) {
    return (
      <Navigate
        to={auth.workspace === "office" ? "/office" : "/personal"}
        replace
      />
    );
  }

  return <Navigate to="/login" replace />;
}

/**
 * Main App with routing
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login / password gate */}
        <Route path="/login" element={<PasswordPage />} />

        {/* Office workspace */}
        <Route
          path="/office"
          element={
            <ProtectedRoute workspace="office">
              <WorkspaceLayout workspace="office">
                {/* ⭐ Pass linkType so it filters & saves with type="office" */}
                <ImpLinksPage linkType="office" />
              </WorkspaceLayout>
            </ProtectedRoute>
          }
        />

        {/* Personal workspace */}
        <Route
          path="/personal"
          element={
            <ProtectedRoute workspace="personal">
              <WorkspaceLayout workspace="personal">
                {/* ⭐ Pass linkType so it filters & saves with type="personal" */}
                <ImpLinksPage linkType="personal" />
              </WorkspaceLayout>
            </ProtectedRoute>
          }
        />

        {/* Root: redirect based on auth */}
        <Route path="/" element={<RootRedirect />} />

        {/* Fallback 404 → redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
