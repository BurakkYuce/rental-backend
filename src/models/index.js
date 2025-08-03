// src/models/index.js - Model relationships and exports
const { sequelize } = require("../config/database");

// Import models with detailed logging
console.log("🔄 Loading models...");

let Admin, Car, Blog, Listing;

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
  Blog = require("./Blog");
  console.log("✅ Blog model loaded:", typeof Blog, Blog.name);
} catch (error) {
  console.error("❌ Error loading Blog model:", error.message);
}

try {
  Listing = require("./Listing");
  console.log("✅ Listing model loaded:", typeof Listing, Listing.name);
} catch (error) {
  console.error("❌ Error loading Listing model:", error.message);
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
const listingValid = isValidSequelizeModel(Listing, "Listing");

// Define relationships only if models are valid
console.log("\n🔗 Setting up model relationships...");

// Admin -> Car relationship
if (adminValid && carValid) {
  try {
    Admin.hasMany(Car, {
      foreignKey: "userId",
      as: "cars",
      onDelete: "CASCADE",
    });

    Car.belongsTo(Admin, {
      foreignKey: "userId",
      as: "owner",
    });
    console.log("✅ Admin <-> Car relationships established");
  } catch (error) {
    console.error(
      "❌ Error setting up Admin <-> Car relationships:",
      error.message
    );
  }
} else {
  console.log("⚠️ Skipping Admin <-> Car relationships (models not valid)");
}

// Admin -> Blog relationship
if (adminValid && blogValid) {
  try {
    Admin.hasMany(Blog, {
      foreignKey: "userId",
      as: "blogs",
      onDelete: "CASCADE",
    });

    Blog.belongsTo(Admin, {
      foreignKey: "userId",
      as: "creator",
    });
    console.log("✅ Admin <-> Blog relationships established");
  } catch (error) {
    console.error(
      "❌ Error setting up Admin <-> Blog relationships:",
      error.message
    );
  }
} else {
  console.log("⚠️ Skipping Admin <-> Blog relationships (models not valid)");
}

// Admin -> Listing relationship
if (adminValid && listingValid) {
  try {
    Admin.hasMany(Listing, {
      foreignKey: "userId",
      as: "listings",
      onDelete: "CASCADE",
    });

    Listing.belongsTo(Admin, {
      foreignKey: "userId",
      as: "owner",
    });
    console.log("✅ Admin <-> Listing relationships established");
  } catch (error) {
    console.error(
      "❌ Error setting up Admin <-> Listing relationships:",
      error.message
    );
  }
} else {
  console.log("⚠️ Skipping Admin <-> Listing relationships (models not valid)");
}

// Call associate methods if they exist (for your Blog.associate function)
console.log("\n🔄 Calling associate methods...");
const models = { Admin, Car, Blog, Listing };

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
if (Listing) exportedModels.Listing = Listing;

console.log("\n📦 Final exported models:", Object.keys(exportedModels));
console.log("🎉 Model setup completed!\n");

module.exports = exportedModels;
