// src/models/Blog.js - Blog Model
const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, "Blog excerpt is required"],
      trim: true,
      maxlength: [300, "Excerpt cannot be more than 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    featuredImage: {
      url: {
        type: String,
        required: [true, "Featured image is required"],
      },
      alt: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
      },
    },
    author: {
      name: {
        type: String,
        required: [true, "Author name is required"],
        default: "Admin",
      },
      avatar: {
        type: String,
        default: "/images/avatars/admin.jpg",
      },
    },
    category: {
      type: String,
      required: [true, "Blog category is required"],
      enum: [
        "Car Reviews",
        "Travel Tips",
        "Maintenance",
        "Insurance",
        "Road Safety",
        "Car Tech",
        "Company News",
        "Industry News",
      ],
      default: "Company News",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    readingTime: {
      type: Number, // in minutes
      default: 5,
    },
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, "Meta title cannot be more than 60 characters"],
      },
      metaDescription: {
        type: String,
        maxlength: [160, "Meta description cannot be more than 160 characters"],
      },
      keywords: [{
        type: String,
        trim: true,
      }],
    },
    relatedPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create slug from title before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Calculate reading time based on content length
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  // Set SEO defaults if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title.substring(0, 60);
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Index for search functionality
blogSchema.index({ title: "text", content: "text", excerpt: "text" });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ featured: 1, status: 1, publishedAt: -1 });

// Virtual for formatted date
blogSchema.virtual("formattedDate").get(function () {
  const date = this.publishedAt || this.createdAt;
  if (!date) {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for reading time display
blogSchema.virtual("readingTimeDisplay").get(function () {
  return `${this.readingTime} min read`;
});

// Static method to get published blogs with pagination
blogSchema.statics.getPublishedBlogs = function (options = {}) {
  const {
    page = 1,
    limit = 10,
    category,
    tag,
    search,
    featured
  } = options;
  
  const skip = (page - 1) * limit;
  let query = { status: "published" };
  
  if (category) query.category = category;
  if (tag) query.tags = { $in: [tag] };
  if (featured !== undefined) query.featured = featured;
  
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query)
    .sort({ publishedAt: -1, featured: -1 })
    .skip(skip)
    .limit(limit)
    .populate("relatedPosts", "title slug featuredImage excerpt publishedAt");
};

// Static method to get blog categories with counts
blogSchema.statics.getCategoriesWithCounts = function () {
  return this.aggregate([
    { $match: { status: "published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { category: "$_id", count: 1, _id: 0 } }
  ]);
};

// Static method to get popular tags
blogSchema.statics.getPopularTags = function (limit = 20) {
  return this.aggregate([
    { $match: { status: "published" } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { tag: "$_id", count: 1, _id: 0 } }
  ]);
};

// Instance method to increment view count
blogSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model("Blog", blogSchema);