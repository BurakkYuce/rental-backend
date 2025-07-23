// src/controllers/blogController.js - Blog Controller
const Blog = require("../models/Blog");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// @desc    Get all published blogs with pagination
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      search,
      featured
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      tag,
      search,
      featured: featured === 'true' ? true : undefined
    };

    const blogs = await Blog.getPublishedBlogs(options);
    
    // Get total count for pagination
    let countQuery = { status: "published" };
    if (category) countQuery.category = category;
    if (tag) countQuery.tags = { $in: [tag] };
    if (featured !== undefined) countQuery.featured = featured === 'true';
    if (search) countQuery.$text = { $search: search };
    
    const totalBlogs = await Blog.countDocuments(countQuery);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalBlogs,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blogs",
    });
  }
};

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const blogs = await Blog.find({
      status: "published",
      featured: true,
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select("title slug excerpt featuredImage publishedAt readingTime category");

    res.json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("Error in getFeaturedBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured blogs",
    });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      slug,
      status: "published",
    }).populate("relatedPosts", "title slug featuredImage excerpt publishedAt readingTime");

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    // Increment view count
    await blog.incrementViews();

    // Get related posts if none are set
    if (!blog.relatedPosts.length) {
      const relatedPosts = await Blog.find({
        _id: { $ne: blog._id },
        category: blog.category,
        status: "published",
      })
        .limit(3)
        .select("title slug featuredImage excerpt publishedAt readingTime");
      
      blog.relatedPosts = relatedPosts;
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error in getBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog post",
    });
  }
};

// @desc    Get blog categories
// @route   GET /api/blogs/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.getCategoriesWithCounts();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// @desc    Get popular tags
// @route   GET /api/blogs/tags
// @access  Public
exports.getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tags = await Blog.getPopularTags(limit);

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getPopularTags:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tags",
    });
  }
};

// @desc    Search blogs
// @route   GET /api/blogs/search
// @access  Public
exports.searchBlogs = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: q,
    };

    const blogs = await Blog.getPublishedBlogs(options);
    const totalBlogs = await Blog.countDocuments({
      status: "published",
      $text: { $search: q }
    });
    
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.json({
      success: true,
      data: {
        blogs,
        query: q,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalBlogs,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in searchBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search blogs",
    });
  }
};

// ===== ADMIN FUNCTIONS =====

// @desc    Get all blogs for admin (including drafts)
// @route   GET /api/admin/blogs
// @access  Private/Admin
exports.getAdminBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("title slug excerpt featuredImage status category featured views likes publishedAt createdAt");

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalBlogs,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminBlogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blogs",
    });
  }
};

// @desc    Get single blog for admin editing
// @route   GET /api/admin/blogs/:id
// @access  Private/Admin
exports.getAdminBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error in getAdminBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog",
    });
  }
};

// @desc    Create new blog post
// @route   POST /api/admin/blogs
// @access  Private/Admin
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      featuredImage,
      author,
      category,
      tags,
      status,
      featured,
      seo,
    } = req.body;

    // Validate required fields
    if (!title || !excerpt || !content) {
      return res.status(400).json({
        success: false,
        error: "Title, excerpt, and content are required",
      });
    }

    const blogData = {
      title,
      excerpt,
      content,
      featuredImage: featuredImage || { url: "/images/blog/default.jpg" },
      author: author || { name: "Admin" },
      category: category || "Company News",
      tags: tags || [],
      status: status || "draft",
      featured: featured || false,
      seo: seo || {},
    };

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      data: blog,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Error in createBlog:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create blog post",
    });
  }
};

// @desc    Update blog post
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedBlog,
      message: "Blog post updated successfully",
    });
  } catch (error) {
    console.error("Error in updateBlog:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to update blog post",
    });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    // Delete featured image from Cloudinary if it exists
    if (blog.featuredImage?.publicId) {
      try {
        await deleteImage(blog.featuredImage.publicId);
      } catch (imageError) {
        console.warn("Error deleting image from Cloudinary:", imageError);
      }
    }

    await Blog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBlog:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete blog post",
    });
  }
};

// @desc    Toggle blog featured status
// @route   PATCH /api/admin/blogs/:id/featured
// @access  Private/Admin
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    blog.featured = !blog.featured;
    await blog.save();

    res.json({
      success: true,
      data: { featured: blog.featured },
      message: `Blog ${blog.featured ? 'featured' : 'unfeatured'} successfully`,
    });
  } catch (error) {
    console.error("Error in toggleFeatured:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle featured status",
    });
  }
};

// @desc    Update blog status
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private/Admin
exports.updateBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be draft, published, or archived",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
      message: `Blog status updated to ${status} successfully`,
    });
  } catch (error) {
    console.error("Error in updateBlogStatus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update blog status",
    });
  }
};