import { useTheme, type ColorTheme } from "../context/themeContext";

export const ThemeSwitcher = () => {
  const { mode, colorTheme, toggleMode, changeColor } = useTheme();

  const colors = [
    { name: "orange", code: "#e16a3d", class: "bg-[#e16a3d]" },
    { name: "red", code: "#ef4444", class: "bg-red-500" },
    { name: "blue", code: "#3b82f6", class: "bg-blue-500" },
    { name: "green", code: "#10b981", class: "bg-green-500" },
    { name: "purple", code: "#8b5cf6", class: "bg-purple-500" },
  ];

  return (
    <div className="fixed top-12 right-12 z-50 bg-white p-3 rounded-sm shadow-lg border border-gray-200">
      {/* Color Theme Selector */}
      <div className="">
        <div className="text-sm text-gray-900 text-center">Set Primary color</div>
        <div className="mb-1">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => changeColor(color.name as ColorTheme)}
              className={`w-4 h-4 m-2 rounded-full ${color.class} ${
                colorTheme === color.name
                  ? "ring-2 ring-offset-2 ring-primary-dark"
                  : ""
              } transition-all duration-200 hover:scale-110`}
              title={`Change to ${color.name} theme`}
              aria-label={`Change to ${color.name} theme`}
            />
          ))}
        </div>
      </div>
       {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleMode}
        className="p-2 w-full rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Toggle theme"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm capitalize text-gray-900">{mode} Mode</div>
        <>
         {mode === "light" ? (
          <svg
            className="w-4 h-4 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
        </>
        </div>
      </button>
    </div>
  );
};
