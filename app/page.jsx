"use client";

import React from "react";
import { BiBarChartAlt2, BiTask, BiUserCheck, BiUserPlus } from "react-icons/bi";
import { motion } from "framer-motion";

const stats = [
  { title: "Revenue", value: "৳24,500", icon: BiBarChartAlt2 },
  { title: "Total Projects", value: "24", icon: BiTask },
  { title: "Profit", value: "৳12,000", icon: BiUserCheck },
  { title: "Due", value: "৳5,000", icon: BiUserPlus },
];

const Home = () => {
  return (
    <main className="w-full min-h-screen bg-gray-100 p-8 md:p-12">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-lg text-gray-600 mb-10">Welcome back, here's an overview of your metrics.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ title, value, icon: Icon }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col justify-between p-6 rounded-2xl bg-gray-800 text-white shadow-xl transform hover:shadow-2xl transition-all duration-300 border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-lg text-white">{title}</span>
              <div className="p-2 rounded-full bg-gray-700 text-gray-400">
                <Icon size={24} />
              </div>
            </div>
            <div className="text-4xl font-bold tracking-wide text-white">
              {value}
            </div>
            <p className="text-sm text-gray-400 mt-2">from last month</p>
          </motion.div>
        ))}
      </div>
    </main>
  );
};


export default Home;