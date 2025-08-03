// create-new-admin.js - Yeni Admin Oluştur
const { connectDB } = require("./src/config/database");
const Admin = require("./src/models/Admin");

const createNewAdmin = async () => {
  try {
    console.log("🔄 Creating new admin...");

    // Database'e bağlan
    await connectDB();
    console.log("✅ Database connected");

    // Admin verilerini kontrol et
    const username = "admin";
    const password = "admin123";

    // Mevcut admin kontrolü
    const existingAdmin = await Admin.findOne({
      where: { username: username },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin '${username}' already exists!`);
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`✅ Active: ${existingAdmin.isActive}`);
      console.log(`🔑 You can login with: ${username} / ${password}`);
      process.exit(0);
    }

    // Yeni admin oluştur
    const newAdmin = await Admin.create({
      username: username,
      email: "admin@mitcarrental.com",
      password: password,
      firstName: "System",
      lastName: "Administrator",
      role: "super_admin",
      isActive: true,
      emailVerified: true,
      permissions: [
        {
          module: "cars",
          actions: ["create", "read", "update", "delete", "export"],
        },
        {
          module: "locations",
          actions: ["create", "read", "update", "delete", "export"],
        },
        {
          module: "bookings",
          actions: ["create", "read", "update", "delete", "export"],
        },
        { module: "content", actions: ["create", "read", "update", "delete"] },
        { module: "settings", actions: ["create", "read", "update", "delete"] },
        { module: "admin", actions: ["create", "read", "update", "delete"] },
      ],
      preferences: {
        theme: "light",
        language: "tr",
        timezone: "Europe/Istanbul",
        dateFormat: "DD/MM/YYYY",
        notifications: {
          email: true,
          browser: true,
          messages: true,
          newBookings: true,
        },
      },
    });

    console.log("✅ New admin created successfully!");
    console.log("📋 Admin Details:");
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Username: ${newAdmin.username}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Name: ${newAdmin.firstName} ${newAdmin.lastName}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Active: ${newAdmin.isActive}`);
    console.log("");
    console.log("🔑 Login Credentials:");
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log("");
    console.log("🌍 Access URLs:");
    console.log("   Admin Login: http://localhost:5173/admin/login");
    console.log("   Admin Panel: http://localhost:5173/admin");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

// Admin oluştur
createNewAdmin();
