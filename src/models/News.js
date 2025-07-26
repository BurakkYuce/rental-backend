// src/models/News.js - News Model
const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "News title is required"],
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
      required: [true, "News excerpt is required"],
      trim: true,
      maxlength: [300, "Excerpt cannot be more than 300 characters"],
    },
    content: {
      type: String,
      required: [true, "News content is required"],
    },
    featuredImage: {
      url: {
        type: String,
        default: "/images/news/pic-blog-1.jpg",
      },
      alt: {
        type: String,
        default: "",
      },
      filename: String,
    },
    author: {
      type: String,
      default: "Admin",
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Car News",
        "Industry Updates", 
        "Travel Tips",
        "Safety",
        "Technology",
        "Company News",
        "General",
      ],
      default: "General",
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug from title
newsSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/ +/g, "-");
  }
  next();
});

// Static method to get published news
newsSchema.statics.getPublished = function(options = {}) {
  const { limit = 10, page = 1, category, featured } = options;
  const skip = (page - 1) * limit;
  
  let query = { status: "published" };
  
  if (category) {
    query.category = category;
  }
  
  if (featured !== undefined) {
    query.featured = featured;
  }
  
  return this.find(query)
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-content'); // Exclude full content for list views
};

// Static method to get recent news
newsSchema.statics.getRecent = function(limit = 3) {
  return this.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title excerpt featuredImage publishedAt slug author tags');
};

// Virtual for formatted date
newsSchema.virtual('formattedDate').get(function() {
  const date = this.publishedAt;
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    full: date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
  };
});

// Increment view count
newsSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

const News = mongoose.model("News", newsSchema);

module.exports = News;