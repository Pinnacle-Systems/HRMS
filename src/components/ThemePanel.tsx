import React from 'react';
import { useTheme } from '../context/Theme';

export const ThemePanel = () => {
  const { mode, colorTheme, toggleMode, changeColor, setMode } = useTheme();

  const colorThemes = [
    { name: 'Orange', value: 'orange', class: 'bg-[#e16a3d]' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Theme Settings</h3>
      
      {/* Dark/Light Mode */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Appearance Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('light')}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'light'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'dark'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Dark
          </button>
        </div>
      </div>

      {/* Color Theme */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Primary Color
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colorThemes.map((color) => (
            <button
              key={color.value}
              onClick={() => changeColor(color.value as any)}
              className={`h-10 rounded-lg ${color.class} ${
                colorTheme === color.value
                  ? 'ring-2 ring-offset-2 ring-gray-400'
                  : ''
              } transition-all hover:scale-105`}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};