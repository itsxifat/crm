"use client";

import React from "react";
import { BiBarChartAlt2, BiTask, BiUserCheck, BiUserPlus } from "react-icons/bi";

const stats = [
  { title: "Revenue", value: "৳24K", icon: BiBarChartAlt2 },
  { title: "Total Projects", value: "24", icon: BiTask },
  { title: "Profit", value: "৳12K", icon: BiUserCheck },
  { title: "Due", value: "৳5K", icon: BiUserPlus },
];

const Home = () => {
  return (
    <main className="w-full min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8">
        {stats.map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className="flex flex-col justify-between rounded-2xl p-5 bg-white text-black shadow-md hover:scale-105 transition-transform duration-300"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-lg">{title}</span>
              <Icon size={28} className="text-black" />
            </div>
            <div className="mt-4 text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Home;
