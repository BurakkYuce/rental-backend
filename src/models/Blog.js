// models/Blog.js - Fixed version with proper field mapping
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Blog = sequelize.define(
    "Blog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 500],
        },
      },
      slug: {
        type: DataTypes.STRING(600),
        allowNull: true,
        unique: true,
        validate: {
          len: [1, 600],
        },
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "archived"),
        defaultValue: "draft",
        allowNull: false,
      },
      featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      author: {
        type: DataTypes.STRING(255),
        defaultValue: "Admin",
      },
      category: {
        type: DataTypes.STRING(100),
        defaultValue: "Company News",
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "view_count", // Maps to view_count in database
      },
      publishDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "publish_date", // Maps to publish_date in database
      },
      // ✅ FIX: Proper field mapping for user relationship
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "user_id", // ✅ Maps to user_id column in database
        references: {
          model: "admins",
          key: "id",
        },
      },
    },
    {
      tableName: "blogs",
      underscored: true, // ✅ This converts camelCase to snake_case automatically
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeValidate: (blog) => {
          // Auto-generate slug if not provided
          if (blog.title && !blog.slug) {
            blog.slug = blog.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")
              .trim("-");
          }
        },
        beforeCreate: (blog) => {
          // Set publish date when status is published
          if (blog.status === "published" && !blog.publishDate) {
            blog.publishDate = new Date();
          }
        },
        beforeUpdate: (blog) => {
          // Set publish date when status changes to published
          if (
            blog.changed("status") &&
            blog.status === "published" &&
            !blog.publishDate
          ) {
            blog.publishDate = new Date();
          }
        },
      },
    }
  );

  // ✅ Define associations
  Blog.associate = (models) => {
    // Blog belongs to Admin (author)
    Blog.belongsTo(models.Admin, {
      foreignKey: "userId",
      as: "admin",
      onDelete: "SET NULL",
    });
  };

  return Blog;
};
