// src/controllers/contentController.js - Content and News related API endpoints
const { validationResult } = require("express-validator");
const News = require("../models/News");

/**
 * @desc Get all published news articles with pagination
 * @route GET /api/news
 * @access Public
 */
const getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 6, tag, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query for database
    let query = { status: "published" };
    
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalArticles = await News.countDocuments(query);
    
    // If no articles exist, return empty result
    if (totalArticles === 0) {
      return res.status(200).json({
        success: true,
        data: {
          articles: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalArticles: 0,
            hasNext: false,
            hasPrev: false,
            limit: limitNum,
          },
        },
      });
    }

    const totalPages = Math.ceil(totalArticles / limitNum);
    const skip = (pageNum - 1) * limitNum;

    // Fetch articles from database
    const articles = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('title excerpt featuredImage publishedAt slug author tags category readingTime viewCount');

    // Transform data structure to match frontend expectations
    const articlesWithDateFormat = articles.map((article) => {
      const publishedDate = new Date(article.publishedAt);
      return {
        id: article._id,
        _id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        image: article.featuredImage?.url || "/images/news/pic-blog-1.jpg",
        featuredImage: article.featuredImage,
        slug: article.slug,
        author: article.author,
        tags: article.tags,
        category: article.category,
        readingTime: article.readingTime,
        viewCount: article.viewCount,
        publishedAt: article.publishedAt.toISOString(),
        date: {
          day: publishedDate.getDate().toString().padStart(2, "0"),
          month: publishedDate
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase(),
          full: publishedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };
    });

    // Calculate pagination info
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        articles: articlesWithDateFormat,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalArticles,
          hasNext,
          hasPrev,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news articles",
      message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

/**
 * @desc Get single news article by slug
 * @route GET /api/news/:slug
 * @access Public
 */
const getSingleNews = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await News.findOne({ slug, status: "published" });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article not found",
      });
    }

    // Increment view count
    await article.incrementViews();

    const publishedDate = new Date(article.publishedAt);
    const formattedArticle = {
      id: article._id,
      _id: article._id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      image: article.featuredImage?.url || "/images/news/pic-blog-1.jpg",
      featuredImage: article.featuredImage,
      slug: article.slug,
      author: article.author,
      tags: article.tags,
      category: article.category,
      readingTime: article.readingTime,
      viewCount: article.viewCount,
      publishedAt: article.publishedAt.toISOString(),
      date: {
        day: publishedDate.getDate().toString().padStart(2, "0"),
        month: publishedDate
          .toLocaleDateString("en-US", { month: "short" })
          .toUpperCase(),
        full: publishedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    };

    res.status(200).json({
      success: true,
      data: {
        article: formattedArticle,
      },
    });
  } catch (error) {
    console.error("Error in getSingleNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch article",
      message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

/**
 * @desc Get recent news articles
 * @route GET /api/news/recent
 * @access Public
 */
const getRecentNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit);

    const articles = await News.getRecent(limitNum);

    const formattedArticles = articles.map((article) => {
      const publishedDate = new Date(article.publishedAt);
      return {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        image: article.featuredImage?.url || "/images/news/pic-blog-1.jpg",
        slug: article.slug,
        author: article.author,
        tags: article.tags,
        publishedAt: article.publishedAt.toISOString(),
        date: {
          day: publishedDate.getDate().toString().padStart(2, "0"),
          month: publishedDate
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase(),
          full: publishedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        articles: formattedArticles,
      },
    });
  } catch (error) {
    console.error("Error in getRecentNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent news",
      message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Admin functions (placeholder - implement as needed)
const getAdminNews = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const getAdminNewsDetails = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const createAdminNews = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const updateAdminNews = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const deleteAdminNews = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const updateNewsStatus = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

// Other placeholder functions
const getPopularTags = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { tags: ["travel", "car rental", "technology", "safety", "tips"] }
  });
};

const getTestimonials = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { testimonials: [] }
  });
};

const getNewsComments = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { comments: [] }
  });
};

const postNewsComment = async (req, res) => {
  res.status(501).json({ success: false, error: "Not implemented" });
};

const getCompanyAbout = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { about: "Company about information" }
  });
};

const trackSocialShare = async (req, res) => {
  res.status(200).json({ success: true });
};

module.exports = {
  getAllNews,
  getSingleNews,
  getRecentNews,
  getPopularTags,
  getTestimonials,
  getNewsComments,
  postNewsComment,
  getCompanyAbout,
  trackSocialShare,
  // Admin news management APIs
  getAdminNews,
  getAdminNewsDetails,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  updateNewsStatus,
};