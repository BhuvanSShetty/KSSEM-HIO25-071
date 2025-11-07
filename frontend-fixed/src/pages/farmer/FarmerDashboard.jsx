import React from "react";
import { useAuth } from "../../state/AuthContext.jsx";

export default function FarmerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold">Welcome, {user?.name || "Farmer"}</h2>
        <p className="text-sm text-gray-500">
          Manage your devices and monitor data from your farm dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-lg font-medium">Your Devices</h3>
          <p className="text-sm text-gray-500">Add, remove and configure your IoT devices.</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium">Data & Analytics</h3>
          <p className="text-sm text-gray-500">(Coming soon) Live soil, weather and crop stats.</p>
        </div>
      </div>
    </div>
  );
}
