import "dotenv/config";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Table from "./model/Table.js";

const seedTables = async () => {
  try {
    await connectDB();

    const layout = [
      { row: 1, tableCount: 6, chairCount: 6 },
      { row: 2, tableCount: 6, chairCount: 4 },
      { row: 3, tableCount: 7, chairCount: 6 },
      { row: 4, tableCount: 6, chairCount: 4 }
    ];

    const operations = [];
    let tableNumber = 1;

    // Create student tables
    for (const rowData of layout) {
      for (
        let position = 1;
        position <= rowData.tableCount;
        position++
      ) {
        const currentTableNumber = `T${tableNumber}`;

        const chairs = Array.from(
          { length: rowData.chairCount },
          (_, index) => ({
            chairNumber: index + 1,
            status: "available"
          })
        );

        operations.push({
          updateOne: {
            filter: { tableNumber: currentTableNumber },
            update: {
              $set: {
                section: "student",
                row: rowData.row,
                position,
                chairs
              },
              $setOnInsert: {
                tableNumber: currentTableNumber
              }
            },
            upsert: true
          }
        });

        tableNumber++;
      }
    }

    // Create teacher tables
    for (let i = 1; i <= 3; i++) {
      const currentTableNumber = `TT${i}`;

      const chairs = Array.from(
        { length: 6 },
        (_, index) => ({
          chairNumber: index + 1,
          status: "available"
        })
      );

      operations.push({
        updateOne: {
          filter: { tableNumber: currentTableNumber },
          update: {
            $set: {
              section: "teacher",
              row: null,
              position: i,
              chairs
            },
            $setOnInsert: {
              tableNumber: currentTableNumber
            }
          },
          upsert: true
        }
      });
    }

    await Table.bulkWrite(operations);

    console.log("SeatMate layout created successfully!");
    console.log("Student tables: 25");
    console.log("Teacher tables: 3");
    console.log("Total tables: 28");
    console.log("Total chairs: 144");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedTables();