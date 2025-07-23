// src/controllers/contentController.js - Content and News related API endpoints
const { validationResult } = require("express-validator");

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news articles with pagination
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Items per page
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *     responses:
 *       200:
 *         description: News articles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     articles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           excerpt:
 *                             type: string
 *                           image:
 *                             type: string
 *                           date:
 *                             type: object
 *                             properties:
 *                               day:
 *                                 type: string
 *                               month:
 *                                 type: string
 *                               full:
 *                                 type: string
 *                           slug:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
const getAllNews = async (req, res) => {
  try {
    const { page = 1, limit = 6, tag, search } = req.query;

    // Mock news articles data
    const mockArticles = [
      {
        id: 1,
        title: "Enjoy Best Travel Experience",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-1.jpg",
        createdAt: new Date("2024-03-20"),
        slug: "enjoy-best-travel-experience",
        tags: ["travel", "vacation", "tourism"],
        author: "John Doe",
        status: "published",
      },
      {
        id: 2,
        title: "The Future of Car Rent",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-2.jpg",
        createdAt: new Date("2024-03-19"),
        slug: "future-of-car-rent",
        tags: ["travel", "car", "technology"],
        author: "Jane Smith",
        status: "published",
      },
      {
        id: 3,
        title: "Holiday Tips For Backpacker",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Excepteur sint occaecat cupidatat non proident.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-3.jpg",
        createdAt: new Date("2024-03-18"),
        slug: "holiday-tips-for-backpacker",
        tags: ["holiday", "travel", "accommodation"],
        author: "Mike Johnson",
        status: "published",
      },
      {
        id: 4,
        title: "Travel Destination For Couple",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Sed do eiusmod tempor incididunt ut labore.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-4.jpg",
        createdAt: new Date("2024-03-17"),
        slug: "travel-destination-for-couple",
        tags: ["travel", "romance", "vacation"],
        author: "Sarah Wilson",
        status: "published",
      },
      {
        id: 5,
        title: "The Essential Guide to Hotel",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Lorem ipsum dolor sit amet.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-5.jpg",
        createdAt: new Date("2024-03-16"),
        slug: "essential-guide-to-hotel",
        tags: ["hotel", "accommodation", "travel"],
        author: "David Brown",
        status: "published",
      },
      {
        id: 6,
        title: "Travel on a Budget",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Consectetur adipiscing elit.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-6.jpg",
        createdAt: new Date("2024-03-15"),
        slug: "travel-on-budget",
        tags: ["travel", "budget", "tips"],
        author: "Lisa Davis",
        status: "published",
      },
    ];

    let filteredArticles = mockArticles;

    // Filter by tag
    if (tag) {
      filteredArticles = filteredArticles.filter((article) =>
        article.tags.some((articleTag) =>
          articleTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    // Transform articles to match frontend format
    const transformedArticles = paginatedArticles.map((article) => {
      const date = new Date(article.createdAt);
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        image: article.image,
        date: {
          day: date.getDate().toString(),
          month: months[date.getMonth()],
          full: date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
        slug: article.slug,
        tags: article.tags,
        author: article.author,
      };
    });

    const totalPages = Math.ceil(filteredArticles.length / limitNum);

    res.status(200).json({
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalArticles: filteredArticles.length,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news articles",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get single news article by ID or slug
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID or slug
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     image:
 *                       type: string
 *                     date:
 *                       type: object
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     author:
 *                       type: string
 *       404:
 *         description: Article not found
 */
const getSingleNews = async (req, res) => {
  try {
    const { id } = req.params;

    // Mock news article data (in real implementation, this would come from database)
    const mockArticles = [
      {
        id: 1,
        title: "Enjoy Best Travel Experience",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-1.jpg",
        createdAt: new Date("2024-03-20"),
        slug: "enjoy-best-travel-experience",
        tags: ["travel", "vacation", "tourism"],
        author: "John Doe",
        status: "published",
      },
    ];

    // Find article by ID or slug
    let article = mockArticles.find((a) => a.id.toString() === id);
    if (!article) {
      article = mockArticles.find((a) => a.slug === id);
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article not found",
      });
    }

    // Transform article to match frontend format
    const date = new Date(article.createdAt);
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    const transformedArticle = {
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      image: article.image,
      date: {
        day: date.getDate().toString(),
        month: months[date.getMonth()],
        full: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
      slug: article.slug,
      tags: article.tags,
      author: article.author,
    };

    res.status(200).json({ success: true, data: transformedArticle });
  } catch (error) {
    console.error("Error in getSingleNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/news/recent:
 *   get:
 *     summary: Get recent news posts for sidebar
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of recent posts to return
 *     responses:
 *       200:
 *         description: Recent posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       date:
 *                         type: string
 *                       image:
 *                         type: string
 *                       slug:
 *                         type: string
 */
const getRecentNews = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    // Mock recent posts
    const recentPosts = [
      {
        id: 1,
        title: "Enjoy Best Travel Experience",
        date: "June 15, 2022",
        image: "/images/news-thumbnail/pic-blog-1.jpg",
        slug: "enjoy-best-travel-experience",
      },
      {
        id: 2,
        title: "The Future of Car Rent",
        date: "June 15, 2022",
        image: "/images/news-thumbnail/pic-blog-2.jpg",
        slug: "future-of-car-rent",
      },
      {
        id: 3,
        title: "Holiday Tips For Backpacker",
        date: "June 15, 2022",
        image: "/images/news-thumbnail/pic-blog-3.jpg",
        slug: "holiday-tips-for-backpacker",
      },
      {
        id: 4,
        title: "Travel Destination For Couple",
        date: "June 15, 2022",
        image: "/images/news-thumbnail/pic-blog-4.jpg",
        slug: "travel-destination-for-couple",
      },
    ];

    const limitedPosts = recentPosts.slice(0, parseInt(limit));

    res.status(200).json({ success: true, data: limitedPosts });
  } catch (error) {
    console.error("Error in getRecentNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent news",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/news/tags:
 *   get:
 *     summary: Get popular tags for news articles
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Popular tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
const getPopularTags = async (req, res) => {
  try {
    const popularTags = [
      "accommodation",
      "holiday",
      "hostel",
      "hotel",
      "travel",
      "inn",
      "lodge",
      "motel",
      "resort",
      "tourism",
      "vacation",
    ];

    res.status(200).json({ success: true, data: popularTags });
  } catch (error) {
    console.error("Error in getPopularTags:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch popular tags",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get customer testimonials
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of testimonials to return
 *     responses:
 *       200:
 *         description: Testimonials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       company:
 *                         type: string
 *                       image:
 *                         type: string
 *                       text:
 *                         type: string
 *                       rating:
 *                         type: number
 */
const getTestimonials = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    const testimonials = [
      {
        id: 1,
        name: "John",
        company: "Pixar Studio",
        image: "/images/people/1.jpg",
        text: "Great support, like i have never seen before. Thanks to the support team, they are very helpfull. This company provide customers great solution, that makes them best.",
        rating: 5,
      },
      {
        id: 2,
        name: "Sarah",
        company: "Microsoft",
        image: "/images/people/2.jpg",
        text: "Great support, like i have never seen before. Thanks to the support team, they are very helpfull. This company provide customers great solution, that makes them best.",
        rating: 5,
      },
      {
        id: 3,
        name: "Michael",
        company: "Apple",
        image: "/images/people/3.jpg",
        text: "Great support, like i have never seen before. Thanks to the support team, they are very helpfull. This company provide customers great solution, that makes them best.",
        rating: 5,
      },
      {
        id: 4,
        name: "Thomas",
        company: "Samsung",
        image: "/images/people/4.jpg",
        text: "Great support, like i have never seen before. Thanks to the support team, they are very helpfull. This company provide customers great solution, that makes them best.",
        rating: 5,
      },
    ];

    const limitedTestimonials = testimonials.slice(0, parseInt(limit));

    res.status(200).json({ success: true, data: limitedTestimonials });
  } catch (error) {
    console.error("Error in getTestimonials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch testimonials",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/news/{articleId}/comments:
 *   get:
 *     summary: Get comments for a news article
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           author:
 *                             type: string
 *                           date:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           text:
 *                             type: string
 *                           replies:
 *                             type: array
 *                             items:
 *                               type: object
 *                     totalComments:
 *                       type: number
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Article not found
 */
const getNewsComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Mock comments data
    const mockComments = [
      {
        id: 1,
        author: "Merrill Rayos",
        date: "15 January 2020",
        avatar: "/images/misc/avatar-2.jpg",
        text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
        replies: [
          {
            id: 2,
            author: "Jackqueline Sprang",
            date: "15 January 2020",
            avatar: "/images/misc/avatar-2.jpg",
            text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
            parentId: 1,
          },
        ],
      },
      {
        id: 3,
        author: "Sanford Crowley",
        date: "15 January 2020",
        avatar: "/images/misc/avatar-2.jpg",
        text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
        replies: [
          {
            id: 4,
            author: "Lyndon Pocekay",
            date: "15 January 2020",
            avatar: "/images/misc/avatar-2.jpg",
            text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
            parentId: 3,
          },
        ],
      },
      {
        id: 5,
        author: "Aleen Crigger",
        date: "15 January 2020",
        avatar: "/images/misc/avatar-2.jpg",
        text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
        replies: [],
      },
    ];

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedComments = mockComments.slice(startIndex, endIndex);

    // Calculate total comments including replies
    const totalComments = mockComments.reduce((total, comment) => {
      return total + 1 + comment.replies.length;
    }, 0);

    const totalPages = Math.ceil(mockComments.length / limitNum);

    res.status(200).json({
      success: true,
      data: {
        comments: paginatedComments,
        totalComments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getNewsComments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comments",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/news/{articleId}/comments:
 *   post:
 *     summary: Post a comment on a news article
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Commenter's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Commenter's email
 *               message:
 *                 type: string
 *                 description: Comment message
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID (for replies)
 *     responses:
 *       201:
 *         description: Comment posted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     commentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Invalid comment data
 *       404:
 *         description: Article not found
 */
const postNewsComment = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { name, email, message, parentId } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Create comment object (in real implementation, save to database)
    const newComment = {
      id: Date.now(), // Mock ID generation
      articleId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      parentId: parentId || null,
      avatar: "/images/misc/avatar-default.jpg", // Default avatar
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      status: "pending", // Comments might need moderation
      createdAt: new Date(),
    };

    // In a real implementation, you would:
    // 1. Save comment to database
    // 2. Send notification to admins
    // 3. Send confirmation email to commenter
    // 4. Check for spam/moderation

    res.status(201).json({
      success: true,
      data: {
        commentId: newComment.id,
        status: newComment.status,
        message: "Comment submitted successfully and is pending moderation",
      },
    });
  } catch (error) {
    console.error("Error in postNewsComment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to post comment",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/company/about:
 *   get:
 *     summary: Get company about us information
 *     tags: [Company]
 *     responses:
 *       200:
 *         description: Company information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     established:
 *                       type: string
 *                     employees:
 *                       type: number
 *                     locations:
 *                       type: number
 *                     mission:
 *                       type: string
 *                     vision:
 *                       type: string
 */
const getCompanyAbout = async (req, res) => {
  try {
    // Mock company information
    const companyInfo = {
      title: "About Rentaly",
      description:
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
      established: "2010",
      employees: 150,
      locations: 25,
      carsInFleet: 500,
      mission:
        "To provide exceptional car rental experiences with the highest standards of customer service and vehicle quality.",
      vision:
        "To be the leading car rental company globally, making mobility accessible and convenient for everyone.",
      values: [
        "Customer First",
        "Quality Service",
        "Transparency",
        "Innovation",
        "Sustainability",
      ],
      contact: {
        phone: "+905366039907",
        email: "info@rentaly.com",
        address: "123 Car Rental Street, Antalya, Turkey",
      },
    };

    res.status(200).json({ success: true, data: companyInfo });
  } catch (error) {
    console.error("Error in getCompanyAbout:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch company information",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/social/share:
 *   post:
 *     summary: Track social media shares
 *     tags: [Social]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - contentType
 *               - contentId
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [twitter, facebook, linkedin, reddit, pinterest, email]
 *                 description: Social media platform
 *               contentType:
 *                 type: string
 *                 enum: [news, car, page]
 *                 description: Type of content being shared
 *               contentId:
 *                 type: string
 *                 description: ID of the content being shared
 *               url:
 *                 type: string
 *                 description: URL being shared
 *     responses:
 *       200:
 *         description: Share tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareCount:
 *                       type: number
 *                     platform:
 *                       type: string
 *       400:
 *         description: Invalid share data
 */
const trackSocialShare = async (req, res) => {
  try {
    const { platform, contentType, contentId, url } = req.body;

    // Validate required fields
    if (!platform || !contentType || !contentId) {
      return res.status(400).json({
        success: false,
        error: "Platform, content type, and content ID are required",
      });
    }

    // Validate platform
    const validPlatforms = [
      "twitter",
      "facebook",
      "linkedin",
      "reddit",
      "pinterest",
      "email",
    ];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: "Invalid social media platform",
      });
    }

    // Validate content type
    const validContentTypes = ["news", "car", "page"];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid content type",
      });
    }

    // In a real implementation, you would:
    // 1. Save share tracking to analytics database
    // 2. Update share counters
    // 3. Track user engagement metrics

    // Mock share count
    const shareCount = Math.floor(Math.random() * 100) + 1;

    res.status(200).json({
      success: true,
      data: {
        shareCount,
        platform,
        contentType,
        contentId,
        message: "Share tracked successfully",
      },
    });
  } catch (error) {
    console.error("Error in trackSocialShare:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track social share",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// ===== ADMIN NEWS MANAGEMENT APIS =====

/**
 * @swagger
 * /api/admin/news:
 *   get:
 *     summary: Get all news articles for admin with pagination and filtering
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [published, draft, archived]
 *         description: Filter by article status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *     responses:
 *       200:
 *         description: News articles retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminNews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Mock news data for admin management
    let allNews = [
      {
        id: 1,
        title: "Enjoy Best Travel Experience",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-1.jpg",
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
        publishedAt: new Date("2024-03-20"),
        slug: "enjoy-best-travel-experience",
        tags: ["travel", "vacation", "tourism"],
        author: "John Doe",
        status: "published",
        views: 1250,
        likes: 45,
        featured: true,
      },
      {
        id: 2,
        title: "The Future of Car Rent",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-2.jpg",
        createdAt: new Date("2024-03-19"),
        updatedAt: new Date("2024-03-19"),
        publishedAt: new Date("2024-03-19"),
        slug: "future-of-car-rent",
        tags: ["travel", "car", "technology"],
        author: "Jane Smith",
        status: "published",
        views: 890,
        likes: 32,
        featured: false,
      },
      {
        id: 3,
        title: "Holiday Tips For Backpacker",
        content:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Excepteur sint occaecat cupidatat non proident.",
        excerpt:
          "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
        image: "/images/news/pic-blog-3.jpg",
        createdAt: new Date("2024-03-18"),
        updatedAt: new Date("2024-03-18"),
        publishedAt: null,
        slug: "holiday-tips-for-backpacker",
        tags: ["holiday", "travel", "accommodation"],
        author: "Mike Johnson",
        status: "draft",
        views: 0,
        likes: 0,
        featured: false,
      },
    ];

    // Apply filters
    if (status) {
      allNews = allNews.filter((article) => article.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allNews = allNews.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNews = allNews.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allNews.length / limitNum);

    res.status(200).json({
      success: true,
      data: {
        articles: paginatedNews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalArticles: allNews.length,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news articles",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   get:
 *     summary: Get single news article for admin editing
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: News article retrieved successfully
 *       404:
 *         description: Article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const getAdminNewsDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "new") {
      // Return empty article template for new article creation
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          title: "",
          content: "",
          excerpt: "",
          image: "",
          slug: "",
          tags: [],
          author: "",
          status: "draft",
          featured: false,
          publishedAt: null,
        },
      });
    }

    // Mock article data (in real implementation, fetch from database)
    const mockArticle = {
      id: parseInt(id),
      title: "Enjoy Best Travel Experience",
      content:
        "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur. Ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      excerpt:
        "Dolore officia sint incididunt non excepteur ea mollit commodo ut enim reprehenderit cupidatat labore ad laborum consectetur.",
      image: "/images/news/pic-blog-1.jpg",
      slug: "enjoy-best-travel-experience",
      tags: ["travel", "vacation", "tourism"],
      author: "John Doe",
      status: "published",
      featured: true,
      createdAt: new Date("2024-03-20"),
      updatedAt: new Date("2024-03-20"),
      publishedAt: new Date("2024-03-20"),
      views: 1250,
      likes: 45,
    };

    res.status(200).json({ success: true, data: mockArticle });
  } catch (error) {
    console.error("Error in getAdminNewsDetails:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news:
 *   post:
 *     summary: Create new news article
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               featured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: News article created successfully
 *       400:
 *         description: Invalid article data
 *       401:
 *         description: Unauthorized - Admin access required
 */
const createAdminNews = async (req, res) => {
  try {
    const { title, content, excerpt, image, tags, author, status, featured } =
      req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    // Create article object
    const articleData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || content.substring(0, 150) + "...",
      image: image || "/images/news/default.jpg",
      slug: slug,
      tags: tags || [],
      author: author || "Admin",
      status: status || "draft",
      featured: featured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === "published" ? new Date() : null,
      views: 0,
      likes: 0,
    };

    // In a real implementation, save to database
    // const newArticle = await News.create(articleData);

    // Mock response
    const mockArticle = {
      id: Date.now(),
      ...articleData,
    };

    res.status(201).json({
      success: true,
      data: mockArticle,
      message: "News article created successfully",
    });
  } catch (error) {
    console.error("Error in createAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   put:
 *     summary: Update existing news article
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               image:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               author:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: News article updated successfully
 *       404:
 *         description: Article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const updateAdminNews = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.title || !updateData.content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    // Update slug if title changed
    if (updateData.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-");
    }

    // Set published date if status changed to published
    if (updateData.status === "published" && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    updateData.updatedAt = new Date();

    // In a real implementation, update in database
    // const updatedArticle = await News.findByIdAndUpdate(id, updateData, { new: true });

    // Mock response
    res.status(200).json({
      success: true,
      data: {
        id: parseInt(id),
        ...updateData,
        updatedAt: new Date(),
      },
      message: "News article updated successfully",
    });
  } catch (error) {
    console.error("Error in updateAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}:
 *   delete:
 *     summary: Delete news article
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     responses:
 *       200:
 *         description: News article deleted successfully
 *       404:
 *         description: Article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const deleteAdminNews = async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, check if article exists and delete
    // const article = await News.findById(id);
    // if (!article) {
    //   return res.status(404).json({
    //     success: false,
    //     error: 'Article not found'
    //   });
    // }
    // await News.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "News article deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAdminNews:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete news article",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

/**
 * @swagger
 * /api/admin/news/{id}/publish:
 *   patch:
 *     summary: Publish/unpublish news article
 *     tags: [Admin - News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [published, draft, archived]
 *                 description: New publication status
 *     responses:
 *       200:
 *         description: Article status updated successfully
 *       404:
 *         description: Article not found
 *       401:
 *         description: Unauthorized - Admin access required
 */
const updateNewsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["published", "draft", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid article status",
      });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    // Set published date if publishing
    if (status === "published") {
      updateData.publishedAt = new Date();
    } else if (status === "draft") {
      updateData.publishedAt = null;
    }

    // In a real implementation, update in database
    // const updatedArticle = await News.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      success: true,
      data: {
        articleId: id,
        newStatus: status,
        updatedAt: new Date(),
        publishedAt: updateData.publishedAt,
      },
      message: `Article ${
        status === "published"
          ? "published"
          : status === "draft"
          ? "unpublished"
          : "archived"
      } successfully`,
    });
  } catch (error) {
    console.error("Error in updateNewsStatus:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update article status",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

module.exports = {
  // Public content/news APIs
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