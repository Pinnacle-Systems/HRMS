import { useState } from "react";

export default function CreateShift() {
  const [formData, setFormData] = useState({
    shiftName: "",
    code: "",
    type: "General",
    startTime: "",
    endTime: "",
    breakTime: "",
    graceTime: "",
    weeklyOff: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Create Shift
        </h2>

        <p className="text-gray-500 mt-1">
          Configure new company shift policy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Shift Name
          </label>

          <input
            name="shiftName"
            value={formData.shiftName}
            onChange={handleChange}
            placeholder="Enter shift name"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Shift Code
          </label>

          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="GEN-01"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Shift Type
          </label>

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          >
            <option>General</option>
            <option>Night</option>
            <option>Flexible</option>
            <option>Rotational</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Weekly Off
          </label>

          <input
            name="weeklyOff"
            value={formData.weeklyOff}
            onChange={handleChange}
            placeholder="Saturday, Sunday"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Start Time
          </label>

          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            End Time
          </label>

          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Break Time
          </label>

          <input
            name="breakTime"
            value={formData.breakTime}
            onChange={handleChange}
            placeholder="60 mins"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Grace Time
          </label>

          <input
            name="graceTime"
            value={formData.graceTime}
            onChange={handleChange}
            placeholder="15 mins"
            className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button className="border border-gray-200 px-5 py-3 rounded-xl">
          Cancel
        </button>

        <button className="bg-blue-600 text-white px-5 py-3 rounded-xl">
          Save Shift
        </button>
      </div>
    </div>
  );
}