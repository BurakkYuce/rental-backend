// src/controllers/contentController.js - Content and News related API endpoints
const { validationResult } = require("express-validator");
const News = require("../models/News");

// Helper function to create default news articles
const createDefaultNewsArticles = async () => {
  try {
    const existingCount = await News.countDocuments();
    if (existingCount > 0) return;

    const defaultArticles = [
      {
        title: "Electric Vehicles Revolution in Car Rental Industry",
        excerpt: "The car rental industry is experiencing a major transformation with the rapid adoption of electric vehicles. Discover how this shift is changing the landscape for both rental companies and customers.",
        content: "The automotive industry is witnessing an unprecedented shift towards electric vehicles (EVs), and the car rental sector is at the forefront of this revolution. Major rental companies worldwide are investing heavily in electric fleets, recognizing both the environmental benefits and the growing consumer demand for sustainable transportation options. This transformation is not just about replacing gasoline engines with electric motors; it's about reimagining the entire rental experience. From streamlined charging infrastructure at rental locations to mobile apps that help customers locate charging stations during their trips, the industry is adapting to meet the needs of the electric age. Customers are increasingly choosing electric vehicles for their rentals, driven by factors such as lower operating costs, reduced environmental impact, and the unique driving experience that EVs provide. The quiet operation, instant torque, and advanced technology features found in modern electric vehicles are creating new expectations for rental car experiences.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop",
          alt: "Electric car charging station"
        },
        author: "Sarah Johnson",
        category: "Technology",
        tags: ["electric", "vehicles", "sustainability", "technology"],
        publishedAt: new Date("2025-01-15"),
        readingTime: 4,
        viewCount: 245
      },
      {
        title: "Top 10 Road Trip Destinations for Summer 2025",
        excerpt: "Planning your next adventure? Explore our curated list of the most breathtaking road trip destinations that promise unforgettable experiences and stunning landscapes.",
        content: "Summer 2025 presents incredible opportunities for memorable road trips across diverse landscapes and cultures. Our expertly curated list features destinations that offer the perfect blend of natural beauty, cultural richness, and accessible routes suitable for rental vehicles. From the rugged coastlines of Big Sur in California to the mystical landscapes of Iceland's Ring Road, these destinations promise adventures that will create lasting memories. Each destination has been selected based on road conditions, seasonal accessibility, and the unique experiences they offer to travelers. Whether you're seeking dramatic mountain vistas, pristine beaches, historic towns, or vibrant cities, our list caters to every type of traveler. We've also included practical information about the best times to visit, recommended vehicle types, and must-see stops along each route. The beauty of a road trip lies in the freedom it provides – the ability to explore at your own pace, discover hidden gems, and create spontaneous adventures. With the right rental vehicle and proper planning, these destinations will provide the backdrop for some of your most treasured travel experiences.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
          alt: "Scenic mountain road trip view"
        },
        author: "Michael Chen",
        category: "Travel Tips",
        tags: ["road trip", "travel", "summer", "destinations"],
        publishedAt: new Date("2025-01-10"),
        readingTime: 6,
        viewCount: 892
      },
      {
        title: "Understanding Car Rental Insurance: A Complete Guide",
        excerpt: "Navigate the complex world of car rental insurance with confidence. Learn about different coverage options, what's included, and how to make informed decisions that protect you and your wallet.",
        content: "Car rental insurance can be one of the most confusing aspects of renting a vehicle, but understanding your options is crucial for both financial protection and peace of mind. This comprehensive guide breaks down the various types of coverage available, from basic liability insurance to comprehensive damage waivers, helping you make informed decisions based on your specific needs and circumstances. Many travelers are unaware that their personal auto insurance or credit card benefits may already provide coverage for rental vehicles, potentially saving hundreds of dollars on unnecessary duplicate coverage. We'll explore how to verify existing coverage, understand the limitations of different policies, and identify situations where additional rental insurance makes sense. The guide also covers international rental considerations, as insurance requirements and options can vary significantly between countries. We'll discuss common scenarios where rental insurance claims occur, such as minor parking lot incidents, weather-related damage, and theft, providing real-world examples of how different coverage types respond to these situations. By the end of this guide, you'll have the knowledge to confidently navigate rental insurance options and select coverage that provides adequate protection without overpaying for unnecessary extras.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop",
          alt: "Car insurance documents and keys"
        },
        author: "Emily Rodriguez",
        category: "Safety",
        tags: ["insurance", "safety", "rental", "guide"],
        publishedAt: new Date("2025-01-05"),
        readingTime: 8,
        viewCount: 567
      },
      {
        title: "Smart Car Technologies Transforming Modern Rentals",
        excerpt: "From autonomous features to connected services, discover how cutting-edge automotive technologies are revolutionizing the car rental experience and what it means for your next trip.",
        content: "The integration of smart technologies in rental vehicles is fundamentally changing how we interact with and experience rented cars. Today's rental fleets increasingly feature advanced driver assistance systems (ADAS), including adaptive cruise control, lane departure warnings, automatic emergency braking, and parking assistance technologies that make driving safer and more comfortable for renters of all experience levels. Connected car technologies are enabling new services such as remote vehicle unlocking through smartphone apps, real-time vehicle diagnostics, and GPS tracking for enhanced security. These innovations are particularly valuable in the rental context, where customers may be unfamiliar with the vehicle and driving in new locations. Infotainment systems now seamlessly integrate with personal devices, allowing renters to access their music, navigation preferences, and contacts instantly. Some rental companies are experimenting with facial recognition and biometric systems to streamline the pickup process, while others are implementing blockchain technology for secure, transparent transactions. The data collected by these smart systems is also helping rental companies optimize their fleets, predict maintenance needs, and improve customer service. As autonomous driving technology continues to advance, we're beginning to see pilot programs for self-driving rental vehicles in controlled environments, pointing toward a future where the rental experience may be completely reimagined.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
          alt: "Modern car dashboard with smart technology"
        },
        author: "David Park",
        category: "Technology",
        tags: ["smart cars", "technology", "innovation", "future"],
        publishedAt: new Date("2024-12-28"),
        readingTime: 5,
        viewCount: 423
      },
      {
        title: "Sustainable Travel: Eco-Friendly Car Rental Choices",
        excerpt: "Make environmentally conscious decisions on your next trip. Learn about hybrid and electric rental options, carbon offset programs, and sustainable travel practices that make a difference.",
        content: "As environmental awareness continues to grow, travelers are increasingly seeking ways to reduce their carbon footprint, and car rental choices play a significant role in sustainable travel practices. The rental industry has responded with expanded offerings of hybrid and electric vehicles, comprehensive carbon offset programs, and initiatives to reduce the environmental impact of their operations. Modern hybrid vehicles in rental fleets can achieve fuel efficiency ratings of 50+ MPG, significantly reducing emissions compared to traditional gasoline vehicles. Electric vehicle rentals, while still growing in availability, offer zero local emissions and can be powered by renewable energy sources, making them the most sustainable option for short to medium-distance travel. Beyond vehicle selection, many rental companies now offer carbon offset programs that allow customers to neutralize the environmental impact of their trips through investments in renewable energy projects, reforestation initiatives, and clean technology development. This guide explores how to identify and choose eco-friendly rental options, understand the real-world environmental impact of different vehicle types, and incorporate sustainable practices throughout your travel experience. We'll also discuss the growing network of charging infrastructure for electric rentals, tips for maximizing fuel efficiency in any rental vehicle, and how to evaluate the environmental claims made by different rental companies.",
        featuredImage: {
          url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
          alt: "Green leaves on car representing eco-friendly travel"
        },
        author: "Lisa Thompson",
        category: "Industry Updates",
        tags: ["sustainability", "eco-friendly", "environment", "green travel"],
        publishedAt: new Date("2024-12-20"),
        readingTime: 7,
        viewCount: 634
      }
    ];

    await News.insertMany(defaultArticles);
    console.log('✅ Default news articles created successfully');
  } catch (error) {
    console.error('Error creating default news articles:', error);
  }
};

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
    
    // If no articles exist, return empty result (they should be seeded)
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

    // Get total count for pagination
    const totalArticles = await News.countDocuments(query);
    
    // If no articles exist, create default ones
    if (totalArticles === 0 && !tag && !search) {
      await createDefaultNewsArticles();
      // Retry count after creating default articles
      const newTotalArticles = await News.countDocuments(query);
      
      // Fetch the newly created articles
      const articles = await News.find(query)
        .sort({ publishedAt: -1 })
        .limit(limitNum)
        .select('title excerpt featuredImage publishedAt slug author tags category readingTime viewCount');
        
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
      
      return res.status(200).json({
        success: true,
        data: {
          articles: articlesWithDateFormat,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(newTotalArticles / limitNum),
            totalArticles: newTotalArticles,
            hasNext: pageNum < Math.ceil(newTotalArticles / limitNum),
            hasPrev: pageNum > 1,
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
    
    // Fallback to mock data if database fails
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