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
    // 1. Removed <main> and its layout/padding classes (w-full, p-8, etc.)
    //    The layout file now handles all page padding.
    <div>
      {/* 2. Made typography responsive */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
        Dashboard
      </h1>
      <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10">
        Welcome back, here's an overview of your metrics.
      </p>

      {/* 3. The grid was already responsive, which is great. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map(({ title, value, icon: Icon }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-gray-800 text-white shadow-lg transform hover:shadow-xl transition-all duration-300 border border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-base sm:text-lg text-white">{title}</span>
              <div className="p-2 rounded-full bg-gray-700 text-gray-400">
                <Icon size={24} />
              </div>
            </div>
            {/* 4. Made stat value responsive */}
            <div className="text-3xl sm:text-4xl font-bold tracking-wide text-white">
              {value}
            </div>
            <p className="text-sm text-gray-400 mt-2">from last month</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;