// src/controllers/blogController.js - Blog Controller (PostgreSQL)
const { Op } = require("sequelize");
const { Blog } = require("../models");
const { validationResult } = require("express-validator");

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    });
  }
  return null;
};

// @desc    Get all published blogs with pagination
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    // Handle validation errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const {
      page = 1,
      limit = 12,
      category,
      tag,
      search,
      featured,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    console.log("🔍 Blog query params:", req.query);

    // Build where conditions for PostgreSQL
    let where = { status: "published" };

    if (featured === "true") {
      where.featured = true;
    }

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        [Op.contains]: [tag],
      };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
      ];
    }

    console.log("🔍 Where clause:", JSON.stringify(where, null, 2));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Sort options
    const validSortFields = ["created_at", "title", "viewCount", "publishDate"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Get blogs with pagination
    const { rows: blogs, count: totalBlogs } = await Blog.findAndCountAll({
      where,
      order: [[sortField, order]],
      offset,
      limit: limitNum,
      attributes: [
        "id",
        "title",
        "excerpt",
        "slug",
        "image",
        "tags",
        "author",
        "publishDate",
        "viewCount",
        "featured",
        "category",
        "created_at",
        "updated_at",
      ],
    });

    console.log(`✅ Found ${blogs.length} blogs out of ${totalBlogs} total`);

    const totalPages = Math.ceil(totalBlogs / limitNum);

    // Format response to match frontend expectations
    const formattedBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      excerpt: blog.excerpt,
      slug: blog.slug,
      image: blog.image,
      tags: blog.tags || [],
      author: blog.author,
      publishDate: blog.publishDate || blog.created_at,
      viewCount: blog.viewCount || 0,
      featured: blog.featured || false,
      category: blog.category,
      created_at: blog.created_at,
      updated_at: blog.updated_at,
    }));

    res.json({
      success: true,
      data: {
        blogs: formattedBlogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalBlogs,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blogs",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const limit = parseInt(req.query.limit) || 6;

    console.log("🔍 Getting featured blogs, limit:", limit);

    const blogs = await Blog.findAll({
      where: {
        status: "published",
        featured: true,
      },
      order: [
        ["publishDate", "DESC"],
        ["created_at", "DESC"],
      ],
      limit,
      attributes: [
        "id",
        "title",
        "slug",
        "excerpt",
        "image",
        "publishDate",
        "tags",
        "author",
        "category",
      ],
    });

    console.log(`✅ Found ${blogs.length} featured blogs`);

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("❌ Error in getFeaturedBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured blogs",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    console.log("🔍 Getting blog by slug:", slug);

    const blog = await Blog.findOne({
      where: {
        slug,
        status: "published",
      },
    });

    if (!blog) {
      console.log("❌ Blog not found with slug:", slug);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    // Increment view count
    await blog.increment("viewCount");

    console.log("✅ Blog found and view count incremented");

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("❌ Error in getBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Get categories with counts
// @route   GET /api/blogs/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    console.log("🔍 Getting blog categories");

    // Get unique categories from published blogs
    const categories = await Blog.findAll({
      where: { status: "published" },
      attributes: [
        "category",
        [Blog.sequelize.fn("COUNT", Blog.sequelize.col("category")), "count"],
      ],
      group: ["category"],
      having: Blog.sequelize.where(Blog.sequelize.col("category"), "!=", null),
      order: [
        [Blog.sequelize.fn("COUNT", Blog.sequelize.col("category")), "DESC"],
      ],
    });

    const formattedCategories = categories.map((cat) => ({
      name: cat.category,
      count: parseInt(cat.dataValues.count),
    }));

    console.log(`✅ Found ${formattedCategories.length} categories`);

    res.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error) {
    console.error("❌ Error in getCategories:", error);

    // Fallback categories
    const fallbackCategories = [
      { name: "Travel Tips", count: 0 },
      { name: "Car Reviews", count: 0 },
      { name: "Rental Guide", count: 0 },
    ];

    res.json({
      success: true,
      data: fallbackCategories,
    });
  }
};

// @desc    Get popular tags
// @route   GET /api/blogs/tags
// @access  Public
exports.getPopularTags = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const limit = parseInt(req.query.limit) || 20;

    console.log("🔍 Getting popular tags, limit:", limit);

    // Get all published blogs and extract unique tags
    const blogs = await Blog.findAll({
      where: { status: "published" },
      attributes: ["tags"],
    });

    const tagCount = {};
    blogs.forEach((blog) => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim();
            tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by popularity
    const popularTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    console.log(`✅ Found ${popularTags.length} popular tags`);

    res.json({
      success: true,
      data: popularTags,
    });
  } catch (error) {
    console.error("❌ Error in getPopularTags:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch popular tags",
    });
  }
};

// @desc    Search blogs
// @route   GET /api/blogs/search
// @access  Public
exports.searchBlogs = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { q, page = 1, limit = 12 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    console.log("🔍 Searching blogs for:", q);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { rows: blogs, count: totalBlogs } = await Blog.findAndCountAll({
      where: {
        status: "published",
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { content: { [Op.iLike]: `%${q}%` } },
          { excerpt: { [Op.iLike]: `%${q}%` } },
        ],
      },
      order: [
        ["publishDate", "DESC"],
        ["created_at", "DESC"],
      ],
      offset,
      limit: limitNum,
      attributes: [
        "id",
        "title",
        "excerpt",
        "slug",
        "image",
        "tags",
        "author",
        "publishDate",
        "viewCount",
        "category",
      ],
    });

    console.log(
      `✅ Search found ${blogs.length} blogs out of ${totalBlogs} total`
    );

    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.json({
      success: true,
      data: {
        blogs,
        searchQuery: q,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalBlogs,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in searchBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search blogs",
    });
  }
};

// ===== ADMIN ROUTES =====

// @desc    Get all blogs for admin (with all statuses)
// @route   GET /api/admin/blogs
// @access  Private (Admin)
// Debug version of getAdminBlogs - Add this temporarily
exports.getAdminBlogs = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { page = 1, limit = 20, status, search, featured, tag } = req.query;

    console.log("🔍 === BLOG DEBUG START ===");
    console.log("🔍 Admin blog query params:", req.query);
    console.log("🔍 req.admin:", req.admin);
    console.log("🔍 req.user:", req.user);
    console.log("🔍 Admin ID:", req.admin?.id || req.user?.id);

    // Count ALL blogs in database first
    const totalBlogsInDB = await Blog.count();
    console.log("🔍 Total blogs in database:", totalBlogsInDB);

    // Count by status
    const draftCount = await Blog.count({ where: { status: "draft" } });
    const publishedCount = await Blog.count({ where: { status: "published" } });
    console.log("🔍 Draft blogs:", draftCount);
    console.log("🔍 Published blogs:", publishedCount);

    // Build where clause - REMOVE userId filter temporarily for debugging
    let where = {};

    if (status) {
      where.status = status;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (tag) {
      where.tags = {
        [Op.contains]: [tag],
      };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log("🔍 Final where clause:", JSON.stringify(where, null, 2));
    console.log("🔍 Query params:", { page: pageNum, limit: limitNum, offset });

    const { rows: blogs, count: totalBlogs } = await Blog.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      offset,
      limit: limitNum,
    });

    console.log("🔍 Query results:", { blogCount: blogs.length, totalBlogs });
    console.log(
      "🔍 First blog:",
      blogs[0]
        ? {
            id: blogs[0].id,
            title: blogs[0].title,
            status: blogs[0].status,
            userId: blogs[0].userId,
          }
        : "No blogs found"
    );
    console.log("🔍 === BLOG DEBUG END ===");

    const totalPages = Math.ceil(totalBlogs / limitNum);

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalBlogs,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getAdminBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch admin blogs",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};
// @desc    Get single blog for admin editing
// @route   GET /api/admin/blogs/:id
// @access  Private (Admin)
exports.getAdminBlog = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Getting admin blog by ID:", id);

    if (id === "new") {
      // Return empty blog template for creation
      return res.json({
        success: true,
        data: {
          id: null,
          title: "",
          content: "",
          excerpt: "",
          image: null,
          status: "draft",
          featured: false,
          tags: [],
          author: "Admin",
          category: "Company News",
        },
      });
    }

    const blog = await Blog.findByPk(id);

    if (!blog) {
      console.log("❌ Blog not found with ID:", id);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    console.log("✅ Blog found for admin");

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("❌ Error in getAdminBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog",
    });
  }
};

// @desc    Create new blog
// @route   POST /api/admin/blogs
// @access  Private (Admin)
exports.createBlog = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const {
      title,
      content,
      excerpt,
      image,
      status = "draft",
      featured = false,
      tags = [],
      author = "Admin",
      category = "Company News",
    } = req.body;

    console.log("🔄 Creating blog with data:", {
      title,
      status,
      featured,
      tags,
      category,
    });

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    // Get admin user ID - make it optional for now
    const userId =
      req.admin?.id || req.user?.id || "00000000-0000-0000-0000-000000000000";

    const blogData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || content.substring(0, 200) + "...",
      image,
      status,
      featured: Boolean(featured),
      tags: Array.isArray(tags) ? tags.filter((tag) => tag && tag.trim()) : [],
      author,
      category,
      userId,
    };

    console.log("🔄 Final blog data:", blogData);

    const blog = await Blog.create(blogData);

    console.log("✅ Blog created successfully:", blog.id);

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("❌ Error in createBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create blog",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private (Admin)
exports.updateBlog = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const updateData = { ...req.body };

    console.log("🔄 Updating blog:", id, "with data:", updateData);

    const blog = await Blog.findByPk(id);

    if (!blog) {
      console.log("❌ Blog not found for update:", id);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    // Clean up update data
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.content) updateData.content = updateData.content.trim();
    if (updateData.excerpt) updateData.excerpt = updateData.excerpt.trim();
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = updateData.tags.filter((tag) => tag && tag.trim());
    }

    await blog.update(updateData);

    console.log("✅ Blog updated successfully");

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("❌ Error in updateBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update blog",
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private (Admin)
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Deleting blog:", id);

    const blog = await Blog.findByPk(id);

    if (!blog) {
      console.log("❌ Blog not found for deletion:", id);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    await blog.destroy();

    console.log("✅ Blog deleted successfully");

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error in deleteBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete blog",
    });
  }
};

// @desc    Toggle featured status
// @route   PATCH /api/admin/blogs/:id/featured
// @access  Private (Admin)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("⭐ Toggling featured status for blog:", id);

    const blog = await Blog.findByPk(id);

    if (!blog) {
      console.log("❌ Blog not found for featured toggle:", id);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    const newFeaturedStatus = !blog.featured;
    await blog.update({ featured: newFeaturedStatus });

    console.log(`✅ Blog featured status updated to: ${newFeaturedStatus}`);

    res.json({
      success: true,
      message: `Blog ${
        newFeaturedStatus ? "featured" : "unfeatured"
      } successfully`,
      data: { featured: newFeaturedStatus },
    });
  } catch (error) {
    console.error("❌ Error in toggleFeatured:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle featured status",
    });
  }
};

// @desc    Update blog status
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private (Admin)
exports.updateBlogStatus = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { id } = req.params;
    const { status } = req.body;

    console.log("📝 Updating blog status:", id, "to:", status);

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be 'draft', 'published', or 'archived'",
      });
    }

    const blog = await Blog.findByPk(id);

    if (!blog) {
      console.log("❌ Blog not found for status update:", id);
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    const updateData = { status };
    if (status === "published" && !blog.publishDate) {
      updateData.publishDate = new Date();
    }

    await blog.update(updateData);

    console.log("✅ Blog status updated successfully");

    res.json({
      success: true,
      message: `Blog status updated to ${status}`,
      data: {
        status: blog.status,
        publishDate: blog.publishDate,
      },
    });
  } catch (error) {
    console.error("❌ Error in updateBlogStatus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update blog status",
    });
  }
};
