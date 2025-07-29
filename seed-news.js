// seed-news.js - Script to seed news data
const mongoose = require("mongoose");
const News = require("./src/models/News");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/rentaly");
    console.log("✅ MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedNews = async () => {
  try {
    // Clear existing news
    await News.deleteMany({});
    console.log("🗑️ Cleared existing news");

    await News.insertMany(newsArticles);
    console.log(`✅ Successfully seeded ${newsArticles.length} news articles`);

    // Verify the seeding
    const count = await News.countDocuments();
    console.log(`📊 Total news articles in database: ${count}`);
  } catch (error) {
    console.error("❌ Error seeding news:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the seeding
connectDB().then(() => {
  seedNews();
});
