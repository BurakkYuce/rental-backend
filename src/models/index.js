// src/models/index.js - Model relationships and exports
const { sequelize } = require("../config/database");

// Import models with detailed logging
console.log("🔄 Loading models...");

let Admin, Car, Blog, Transfer, Listing, Booking;

try {
  Admin = require("./Admin");
  console.log("✅ Admin model loaded:", typeof Admin, Admin.name);
} catch (error) {
  console.error("❌ Error loading Admin model:", error.message);
}

try {
  Car = require("./cars"); // Note: your file is named 'cars.js'
  console.log("✅ Car model loaded:", typeof Car, Car.name);
} catch (error) {
  console.error("❌ Error loading Car model:", error.message);
}

try {
  const BlogFunction = require("./Blog");
  Blog = BlogFunction(sequelize);
  console.log("✅ Blog model loaded:", typeof Blog, Blog.name);
} catch (error) {
  console.error("❌ Error loading Blog model:", error.message);
}

try {
  const TransferFunction = require("./Transfer");
  Transfer = TransferFunction(sequelize);
  console.log("✅ Transfer model loaded:", typeof Transfer, Transfer.name);
} catch (error) {
  console.error("❌ Error loading Transfer model:", error.message);
}

try {
  Listing = require("./Listing");
  console.log("✅ Listing model loaded:", typeof Listing, Listing.name);
} catch (error) {
  console.error("❌ Error loading Listing model:", error.message);
}

try {
  Booking = require("./Booking");
  console.log("✅ Booking model loaded:", typeof Booking, Booking.name);
} catch (error) {
  console.error("❌ Error loading Booking model:", error.message);
}

// Function to validate if a model is a valid Sequelize model
const isValidSequelizeModel = (model, name) => {
  if (!model) {
    console.error(`❌ ${name} model is null/undefined`);
    return false;
  }

  if (typeof model !== "function") {
    console.error(`❌ ${name} model is not a function (type: ${typeof model})`);
    return false;
  }

  // Check if it has Sequelize model methods
  if (!model.hasMany || !model.belongsTo) {
    console.error(
      `❌ ${name} model doesn't have Sequelize association methods`
    );
    return false;
  }

  console.log(`✅ ${name} model is valid Sequelize model`);
  return true;
};

// Validate all models before setting up relationships
console.log("\n🔍 Validating models...");
const adminValid = isValidSequelizeModel(Admin, "Admin");
const carValid = isValidSequelizeModel(Car, "Car");
const blogValid = isValidSequelizeModel(Blog, "Blog");
const transferValid = isValidSequelizeModel(Transfer, "Transfer");
const listingValid = isValidSequelizeModel(Listing, "Listing");
const bookingValid = isValidSequelizeModel(Booking, "Booking");

// Define relationships only if models are valid
console.log("\n🔗 Setting up model relationships...");

// Relationships are now handled via associate methods in individual models
console.log("✅ Admin <-> Car relationships will be handled by associate methods");

// Relationships are now handled via associate methods in individual models
console.log("✅ Admin <-> Blog relationships will be handled by associate methods");
console.log("✅ Admin <-> Listing relationships will be handled by associate methods");

// Call associate methods if they exist (for your Blog.associate function)
console.log("\n🔄 Calling associate methods...");
const models = { Admin, Car, Blog, Transfer, Listing, Booking };

// Set up Car-Booking association (disabled for now to fix column name issues)
// if (Car && Booking) {
//   Car.hasMany(Booking, { foreignKey: 'carId', as: 'bookings', sourceKey: 'id' });
//   Booking.belongsTo(Car, { foreignKey: 'carId', as: 'car', targetKey: 'id' });
//   console.log("✅ Car <-> Booking associations set up");
// }
console.log("⚠️ Car <-> Booking associations temporarily disabled");

Object.keys(models).forEach((modelName) => {
  const model = models[modelName];
  if (model && typeof model.associate === "function") {
    try {
      console.log(`🔗 Calling ${modelName}.associate...`);
      model.associate(models);
      console.log(`✅ ${modelName}.associate completed`);
    } catch (error) {
      console.error(`❌ Error in ${modelName}.associate:`, error.message);
    }
  }
});

// Export models and sequelize instance
const exportedModels = {
  sequelize,
};

// Only export models that are properly loaded
if (Admin) exportedModels.Admin = Admin;
if (Car) exportedModels.Car = Car;
if (Blog) exportedModels.Blog = Blog;
if (Transfer) exportedModels.Transfer = Transfer;
if (Listing) exportedModels.Listing = Listing;
if (Booking) exportedModels.Booking = Booking;

console.log("\n📦 Final exported models:", Object.keys(exportedModels));
console.log("🎉 Model setup completed!\n");

module.exports = exportedModels;
